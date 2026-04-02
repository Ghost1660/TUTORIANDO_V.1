import sys
import types
import os
import json
import time
import streamlit as st
from PyPDF2 import PdfReader
from pymongo import MongoClient
from datetime import datetime, timedelta

# --- 1. PARCHE DE COMPATIBILIDAD PARA PYTHON 3.13 ---
# Corrige la ausencia del módulo 'pipes' en versiones nuevas de Python
if 'pipes' not in sys.modules:
    sys.modules['pipes'] = types.ModuleType('pipes')

# --- 2. IMPORTACIONES DE GOOGLE GEMINI ---
try:
    from langchain_google_genai import ChatGoogleGenerativeAI
    from langchain_core.messages import HumanMessage, SystemMessage
    # import client for listing available Google GenAI models
    from google.genai.client import Client
    GEMINI_AVAILABLE = True
except ImportError:
    print("Advertencia: langchain-google-genai no está disponible. La funcionalidad de IA estará limitada.")
    GEMINI_AVAILABLE = False

# --- 3. CONFIGURACIÓN DE LA BASE DE DATOS ---
# utiliza MongoDB para persistencia de usuarios y chats
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
try:
    client_db = MongoClient(MONGO_URI)
    db = client_db["tutoriando"]
    users_coll = db["users"]
    chats_coll = db["chats"]
    feedback_coll = db["feedback"]  # nueva colección para reportes y feedback
except Exception as e:
    st.error(f"Error conectando a MongoDB: {e}. Verifica que el servidor esté corriendo.")
    st.stop()

# Eliminar usuarios inactivos por más de 30 días (el admin nunca se elimina)
def eliminar_usuarios_inactivos():
    try:
        frontera = datetime.now() - timedelta(days=30)
        resultado = users_coll.delete_many({
            "last_login": {"$lt": frontera},
            "role": {"$ne": "admin"}
        })
        if resultado.deleted_count > 0:
            st.warning(f"Se eliminaron {resultado.deleted_count} usuario(s) inactivos por más de 30 días.")
    except Exception as e:
        st.error(f"Error al eliminar usuarios inactivos: {e}")

eliminar_usuarios_inactivos()

# ensure email index is sparse so that missing emails don't conflict
try:
    users_coll.drop_index('email_1')
except Exception:
    pass
try:
    users_coll.create_index('email', unique=True, sparse=True)
except Exception:
    pass

# migración automática de usuarios antiguos (archivo JSON)
def _migrate_from_json():
    path = 'usuarios.json'
    if os.path.exists(path):
        try:
            with open(path, 'r', encoding='utf-8') as f:
                datos = json.load(f)
            for u in datos.get('usuarios', []):
                if not users_coll.find_one({"username": u.get('username')}):
                    # asignar rol por defecto
                    u.setdefault("role", "user")
                    # eliminar email si existe para evitar conflictos
                    u.pop("email", None)
                    # agregar campos de tracking si no existen
                    u.setdefault("created_at", datetime.now())
                    u.setdefault("login_count", 0)
                    u.setdefault("learning_style", None)
                    users_coll.insert_one(u)
            # opcional: borrar el archivo tras migrar
            os.remove(path)
        except Exception:
            pass

_migrate_from_json()

def guardar_usuario(nuevo_usuario):
    # garantiza rol
    nuevo_usuario.setdefault("role", "user")
    # eliminar campo email si no se usa
    nuevo_usuario.pop("email", None)
    # agregar fecha de creación y contador de logins
    nuevo_usuario["created_at"] = datetime.now()
    nuevo_usuario["login_count"] = 0
    # agregar campo de estilo de aprendizaje (None inicialmente)
    nuevo_usuario["learning_style"] = None
    # evita duplicados de usuario
    if users_coll.find_one({"username": nuevo_usuario["username"]}):
        return False, "El nombre de usuario ya existe."
    try:
        users_coll.insert_one(nuevo_usuario)
    except Exception as e:
        # capturar duplicados en índice de email u otros
        if "duplicate key" in str(e).lower():
            return False, "Error: clave duplicada en la colección."
        raise
    return True, "Registro exitoso."


def validar_usuario(usuario, clave):
    try:
        u = users_coll.find_one({"username": usuario, "password": clave})
        if u:
            # actualizar última conexión y contador
            users_coll.update_one(
                {"username": usuario},
                {"$set": {"last_login": datetime.now()}, "$inc": {"login_count": 1}}
            )
            return True, (u.get("nombre"), u.get("role", "user"))
        return False, (None, None)
    except Exception as e:
        st.error(f"Error al validar usuario: {e}")
        return False, (None, None)


def cargar_chat(usuario):
    # devuelve lista de mensajes ordenados por inserción
    docs = chats_coll.find({"username": usuario}, {"_id": 0, "role": 1, "content": 1})
    return [d for d in docs]

def agregar_mensaje_chat(usuario, role, content):
    chats_coll.insert_one({"username": usuario, "role": role, "content": content})

def enviar_feedback(usuario, tipo, mensaje):
    feedback_coll.insert_one({
        "username": usuario,
        "tipo": tipo,  # 'error', 'sugerencia', etc.
        "mensaje": mensaje,
        "timestamp": datetime.now()
    })
    return True

def guardar_estilo_aprendizaje(username, learning_style):
    """Guarda el estilo de aprendizaje del usuario en la base de datos"""
    try:
        users_coll.update_one(
            {"username": username},
            {"$set": {"learning_style": learning_style}}
        )
        return True
    except Exception as e:
        st.error(f"Error al guardar estilo de aprendizaje: {e}")
        return False

def obtener_estilo_aprendizaje(username):
    """Obtiene el estilo de aprendizaje del usuario"""
    try:
        user = users_coll.find_one({"username": username})
        return user.get("learning_style") if user else None
    except Exception:
        return None

def obtener_recomendaciones_estudio(estilo_aprendizaje, materia=None):
    """Genera recomendaciones de estudio personalizadas según el estilo de aprendizaje"""
    recomendaciones_base = {
        "Visual": [
            "📊 Crea mapas mentales y diagramas para organizar la información",
            "🎨 Usa colores para resaltar conceptos importantes",
            "📈 Dibuja gráficos y esquemas de los procesos",
            "🎬 Busca videos explicativos en YouTube o plataformas educativas",
            "🖼️ Crea flashcards con imágenes y diagramas",
            "📚 Usa libros con muchas ilustraciones y gráficos"
        ],
        "Auditivo": [
            "🎧 Graba tus propias explicaciones de los conceptos",
            "💬 Forma grupos de estudio para discutir temas",
            "📻 Escucha podcasts educativos sobre el tema",
            "🎤 Explica los conceptos en voz alta como si enseñaras a alguien",
            "🎵 Usa música de fondo mientras estudias (sin letra)",
            "📞 Llama a un amigo para explicarle lo que aprendiste"
        ],
        "Lector/Escritor": [
            "📝 Toma notas detalladas durante las clases/lecturas",
            "📖 Lee textos académicos y artículos relacionados",
            "✍️ Escribe resúmenes de lo aprendido",
            "📓 Crea glosarios con definiciones importantes",
            "📄 Reescribe conceptos con tus propias palabras",
            "📋 Haz listas de términos clave y definiciones"
        ],
        "Kinestésico": [
            "🛠️ Realiza experimentos prácticos cuando sea posible",
            "🏃 Camina mientras escuchas explicaciones",
            "👐 Usa gestos para recordar conceptos",
            "🎭 Representa conceptos a través de role-playing",
            "🔧 Construye modelos o maquetas",
            "⚽ Asocia movimientos físicos con conceptos abstractos"
        ]
    }
    
    # Recomendaciones específicas por materia
    recomendaciones_materia = {
        "Matemáticas": {
            "Visual": ["🎯 Dibuja gráficos de funciones", "📐 Usa geometría para visualizar problemas", "🧮 Crea tablas de valores numéricos"],
            "Auditivo": ["🔊 Explica procedimientos paso a paso verbalmente", "🎧 Escucha explicaciones de teoremas", "💭 Discute estrategias de resolución"],
            "Lector/Escritor": ["📝 Escribe demostraciones completas", "📖 Estudia libros de texto detallados", "📋 Crea algoritmos por escrito"],
            "Kinestésico": ["🧮 Usa objetos físicos para contar", "🎲 Juega con dados para probabilidades", "🏗️ Construye modelos 3D de figuras geométricas"]
        },
        "Ciencias": {
            "Visual": ["🔬 Dibuja diagramas de experimentos", "🌍 Crea mapas conceptuales de ecosistemas", "⚗️ Visualiza reacciones químicas"],
            "Auditivo": ["🎧 Escucha podcasts científicos", "💬 Debate teorías con compañeros", "🎤 Graba explicaciones de procesos"],
            "Lector/Escritor": ["📖 Lee artículos científicos", "📝 Escribe informes de laboratorio", "📓 Crea glosarios científicos"],
            "Kinestésico": ["🧪 Realiza experimentos prácticos", "🌱 Planta semillas para observar crecimiento", "🔭 Usa telescopios o microscopios"]
        },
        "Programación": {
            "Visual": ["💻 Dibuja diagramas de flujo", "🎨 Usa colores en el código para organización", "📊 Crea mapas de arquitectura de software"],
            "Auditivo": ["🎧 Escucha tutoriales en video con audio", "💬 Explica algoritmos verbalmente", "🎤 Comenta tu código en voz alta"],
            "Lector/Escritor": ["📖 Lee documentación técnica", "📝 Escribe pseudocódigo detallado", "📋 Crea listas de funciones y métodos"],
            "Kinestésico": ["⌨️ Escribe código físicamente", "🖱️ Manipula interfaces de usuario", "🔧 Construye proyectos prácticos"]
        }
    }
    
    if estilo_aprendizaje in recomendaciones_base:
        recomendaciones = recomendaciones_base[estilo_aprendizaje].copy()
        
        # Agregar recomendaciones específicas de la materia si existe
        if materia and materia in recomendaciones_materia and estilo_aprendizaje in recomendaciones_materia[materia]:
            recomendaciones.extend(recomendaciones_materia[materia][estilo_aprendizaje])
        
        titulo = f"📚 Recomendaciones de Estudio para tu Estilo {estilo_aprendizaje}"
        
        if materia and materia != "General":
            titulo += f" en {materia}"
        
        return titulo, recomendaciones
    else:
        return "Recomendaciones de Estudio", ["Completa el diagnóstico de estilo de aprendizaje para recibir recomendaciones personalizadas"]

def prueba_diagnostico_aprendizaje(username):
    """Prueba de diagnóstico para determinar el estilo de aprendizaje de forma más realista."""
    st.title("🎓 Diagnóstico de Estilo de Aprendizaje")
    st.write("Antes de utilizar la IA, te haremos una prueba realista basada en situaciones de estudio comunes.")
    st.write("Responde con lo que realmente harías en cada ejercicio. No hay respuestas correctas o incorrectas.")

    # Preguntas del test VARK ampliadas con escenarios realistas
    preguntas = [
        {
            "pregunta": "Estás estudiando para un examen y ves una explicación en video. ¿Qué haces?",
            "opciones": [
                ("Hago capturas y esquemas, y luego repaso visualmente", "Visual"),
                ("Presto atención al audio y repito la explicación en voz alta", "Auditivo"),
                ("Copio en un cuaderno y leo varias veces", "Lector/Escritor"),
                ("Imito la actividad o experimento en la práctica", "Kinestésico")
            ]
        },
        {
            "pregunta": "Tienes que aprender un procedimiento técnico. ¿Cuál es tu preferencia?",
            "opciones": [
                ("Sigo diagramas de flujo o infografías", "Visual"),
                ("Escucho un tutorial y hago anotaciones orales", "Auditivo"),
                ("Leo el manual paso a paso y subrayo frases claves", "Lector/Escritor"),
                ("Lo hago varias veces con mis manos hasta memorizar", "Kinestésico")
            ]
        },
        {
            "pregunta": "Estás en una clase de matemáticas: el profesor escribe en la pizarra. ¿Qué más te ayuda?",
            "opciones": [
                ("Hacer gráficos y dibujos junto con la explicación", "Visual"),
                ("Escuchar la explicación y repetir los pasos mentalmente", "Auditivo"),
                ("Tomar apuntes detallados y revisar después", "Lector/Escritor"),
                ("Resolver ejercicios prácticos al instante", "Kinestésico")
            ]
        },
        {
            "pregunta": "Tienes que memorizar fechas e información histórica. ¿Cuál técnica usas?",
            "opciones": [
                ("Mapas temporales, línea de tiempo reemplazando conceptos", "Visual"),
                ("Cuento la historia en voz alta y escucho grabaciones", "Auditivo"),
                ("Escribo resúmenes y hago tarjetas de memoria", "Lector/Escritor"),
                ("Relaciono fechas con movimientos o actividades físicas", "Kinestésico")
            ]
        },
        {
            "pregunta": "Un nuevo concepto es muy abstracto; ¿qué haces primero?",
            "opciones": [
                ("Busco diagramas conceptuales o mapas mentales", "Visual"),
                ("Pido a alguien que me lo explique en voz alta", "Auditivo"),
                ("Leo varios textos e intento reescribirlo con mis palabras", "Lector/Escritor"),
                ("Hago un modelo físico o una práctica que lo represente", "Kinestésico")
            ]
        },
        {
            "pregunta": "Cuando te exigen un proyecto, ¿cómo te organizas?",
            "opciones": [
                ("Creo esquemas visuales del plan y etapas", "Visual"),
                ("Discuto el plan con el equipo en voz alta", "Auditivo"),
                ("Hago un documento con pasos, fechas y tareas", "Lector/Escritor"),
                ("Empiezo haciendo prototipos concretos e iterativos", "Kinestésico")
            ]
        },
        {
            "pregunta": "Si no entiendes un texto, ¿qué haces?",
            "opciones": [
                ("Busco diagramas/videos que ilustren el contenido", "Visual"),
                ("Escucho una explicación en audio o pido a alguien que me explique", "Auditivo"),
                ("Subrayo, anoto y releo pasajes clave", "Lector/Escritor"),
                ("Intento aplicar inmediatamente lo leído con un ejemplo práctico", "Kinestésico")
            ]
        },
        {
            "pregunta": "Cuando revisas conocimientos, prefieres:",
            "opciones": [
                ("Flashcards con imágenes y esquemas", "Visual"),
                ("Clases grabadas y audiocursos", "Auditivo"),
                ("Textos, apuntes y tests escritos", "Lector/Escritor"),
                ("Simulaciones y prácticas con material físico", "Kinestésico")
            ]
        },
        {
            "pregunta": "En una sesión de estudio grupal, ¿qué haces?",
            "opciones": [
                ("Propongo leer mapas conceptuales y pizarra de ideas", "Visual"),
                ("Explico en voz alta y debato los conceptos", "Auditivo"),
                ("Escribo las conclusiones en un documento colaborativo", "Lector/Escritor"),
                ("Práctico con el grupo ejercicios reales o role plays", "Kinestésico")
            ]
        }
    ]

    # Estado para las respuestas
    if "respuestas_test" not in st.session_state:
        st.session_state.respuestas_test = {}

    # Estado para controlar si mostrar resultados
    if "mostrar_resultados" not in st.session_state:
        st.session_state.mostrar_resultados = False

    # Estado para controlar si el diagnóstico está completo
    if "diagnostico_completo" not in st.session_state:
        st.session_state.diagnostico_completo = False

    # Si el diagnóstico ya está completo, mostrar mensaje de éxito y continuar
    if st.session_state.diagnostico_completo:
        st.success("¡Diagnóstico completado exitosamente!")
        st.info("Redirigiendo a la aplicación principal...")
        time.sleep(2)
        # Limpiar estados
        if "respuestas_test" in st.session_state:
            del st.session_state.respuestas_test
        if "mostrar_resultados" in st.session_state:
            del st.session_state.mostrar_resultados
        if "diagnostico_completo" in st.session_state:
            del st.session_state.diagnostico_completo
        st.rerun()
        return True

    # Mostrar preguntas si no se han mostrado los resultados
    if not st.session_state.mostrar_resultados:
        for i, pregunta in enumerate(preguntas):
            st.markdown(f"### Pregunta {i+1}")
            st.write(pregunta["pregunta"])

            opciones_texto = [opcion[0] for opcion in pregunta["opciones"]]
            seleccionados = st.multiselect(
                f"Selecciona una o más respuestas para la pregunta {i+1}:",
                opciones_texto,
                default=st.session_state.respuestas_test.get(f"pregunta_{i}", []),
                key=f"pregunta_{i}"
            )
            st.session_state.respuestas_test[f"pregunta_{i}"] = seleccionados

        # Botón para calcular resultados
        if st.button("Calcular mi estilo de aprendizaje", type="primary"):
            if any(len(st.session_state.respuestas_test.get(f"pregunta_{i}", [])) == 0 for i in range(len(preguntas))):
                st.error("Por favor, selecciona al menos una opción por cada pregunta antes de continuar.")
            else:
                st.session_state.mostrar_resultados = True
                st.rerun()

    # Mostrar resultados si se calcularon
    if st.session_state.mostrar_resultados:
        # Contar respuestas por estilo
        conteo_estilos = {"Visual": 0, "Auditivo": 0, "Lector/Escritor": 0, "Kinestésico": 0}

        for i, pregunta in enumerate(preguntas):
            respuestas_seleccionadas = st.session_state.respuestas_test.get(f"pregunta_{i}", [])
            for opcion_texto, estilo in pregunta["opciones"]:
                if opcion_texto in respuestas_seleccionadas:
                    conteo_estilos[estilo] += 1

        # Determinar estilo principal
        max_valor = max(conteo_estilos.values())
        principales = [e for e, v in conteo_estilos.items() if v == max_valor and v > 0]

        if len(principales) == 0:
            estilo_principal = "No definido"
        elif len(principales) == 1:
            estilo_principal = principales[0]
        else:
            estilo_principal = "Mixto: " + ", ".join(principales)


        # Determinar estilo principal
        estilo_principal = max(conteo_estilos, key=conteo_estilos.get)

        # Mostrar resultados
        st.success("¡Diagnóstico completado!")
        st.markdown("### 📊 Tus Resultados:")

        col1, col2 = st.columns([2, 1])

        with col1:
            st.markdown(f"**Tu estilo de aprendizaje principal es: {estilo_principal}**")

            # Descripción del estilo
            descripciones = {
                "Visual": "Aprendes mejor viendo información visual como diagramas, gráficos, videos e imágenes. Te beneficia usar mapas mentales, colores y visualizaciones.",
                "Auditivo": "Aprendes mejor escuchando y discutiendo. Te beneficia grabar clases, explicar conceptos en voz alta y participar en debates.",
                "Lector/Escritor": "Aprendes mejor leyendo y escribiendo. Te beneficia tomar notas detalladas, leer textos y hacer resúmenes escritos.",
                "Kinestésico": "Aprendes mejor haciendo y experimentando. Te beneficia actividades prácticas, experimentos y aprendizaje hands-on."
            }

            st.write(descripciones[estilo_principal])

        with col2:
            st.markdown("**Puntuaciones:**")
            for estilo, puntuacion in conteo_estilos.items():
                porcentaje = int((puntuacion / len(preguntas)) * 100)
                st.write(f"{estilo}: {puntuacion}/{len(preguntas)} ({porcentaje}%)")
                st.progress(porcentaje / 100)

        # Botón para confirmar y guardar
        if st.button("Confirmar y continuar", type="primary"):
            st.write(f"DEBUG: Intentando guardar estilo {estilo_principal} para usuario {username}")
            # Guardar el estilo de aprendizaje
            if guardar_estilo_aprendizaje(username, estilo_principal):
                st.success("¡Estilo de aprendizaje guardado exitosamente!")
                st.write(f"DEBUG: Guardado exitoso, configurando diagnostico_completo = True")
                st.session_state.diagnostico_completo = True
                st.write("DEBUG: Llamando st.rerun()")
                st.rerun()
            else:
                st.error("Error al guardar el estilo de aprendizaje. Inténtalo de nuevo.")
                st.write("DEBUG: Error al guardar estilo")

    return False  # No completado aún

# --- 4. CONFIGURACIÓN INICIAL ---
st.set_page_config(page_title="TutorIAndo", page_icon="🎓")

if "autenticado" not in st.session_state:
    st.session_state.autenticado = False
    st.session_state.nombre_usuario = ""
    st.session_state.nombre_completo = ""
    st.session_state.is_admin = False
if "messages" not in st.session_state:
    st.session_state.messages = []

# recupera historial desde la base de datos cuando se autentica
if st.session_state.autenticado and not st.session_state.messages:
    historial = cargar_chat(st.session_state.nombre_usuario)
    st.session_state.messages = historial or []

# --- 5. LÓGICA DE ACCESO (LOGIN Y REGISTRO) ---
if not st.session_state.autenticado:
    st.title("TutorIAndo - Acceso")
    st.write("### Plataforma de tutoría inteligente con IA y almacenamiento seguro")
    tab_ingreso, tab_registro = st.tabs(["Ingresar", "Registrarse"])

    with tab_ingreso:
        with st.form("login_form"):
            user = st.text_input("Usuario")
            pw = st.text_input("Contraseña", type="password")
            if st.form_submit_button("Entrar"):
                es_valido, data = validar_usuario(user, pw)
                if es_valido:
                    nombre_completo, rol = data
                    st.session_state.autenticado = True
                    st.session_state.nombre_usuario = user  # Usar el username del input, no el nombre completo
                    st.session_state.nombre_completo = nombre_completo  # Guardar el nombre completo por separado
                    st.session_state.is_admin = (rol == "admin")
                    st.rerun()
                else:
                    st.error("Usuario o contraseña incorrectos")

    with tab_registro:
        with st.form("register_form"):
            nuevo_nombre = st.text_input("Nombre Completo")
            nuevo_user = st.text_input("Nombre de Usuario")
            nuevo_pw = st.text_input("Contraseña", type="password")
            # solo los administradores pueden crear otro admin
            rol_elegido = "user"
            if st.session_state.get("is_admin"):
                rol_elegido = st.selectbox("Rol", ["user", "admin"], index=0)
            if st.form_submit_button("Crear Cuenta"):
                if nuevo_nombre and nuevo_user and nuevo_pw:
                    exito, msj = guardar_usuario({"username": nuevo_user, "password": nuevo_pw, "nombre": nuevo_nombre, "role": rol_elegido})
                    if exito:
                        st.success(msj)
                    else:
                        st.error(msj)
                else:
                    st.warning("Por favor, completa todos los campos.")
    st.stop()

# --- 6. INTERFAZ PRINCIPAL ---
# Verificar si el usuario ha completado el diagnóstico de estilo de aprendizaje
if not st.session_state.is_admin:  # Los admins no necesitan hacer el diagnóstico
    estilo_actual = obtener_estilo_aprendizaje(st.session_state.nombre_usuario)

    # Verificar si el usuario quiere cambiar su estilo (lo indica el botón del sidebar)
    cambiar_estilo = st.session_state.get("cambiar_estilo", False)

    if not estilo_actual or cambiar_estilo:
        # Resetear el flag de cambio
        if "cambiar_estilo" in st.session_state:
            del st.session_state.cambiar_estilo

        # El usuario no ha completado el diagnóstico o quiere cambiarlo, mostrar la prueba
        prueba_diagnostico_aprendizaje(st.session_state.nombre_usuario)
        st.stop()  # No permitir acceso hasta completar el diagnóstico
    else:
        # Limpiar cualquier estado residual del diagnóstico
        estados_a_limpiar = ["respuestas_test", "mostrar_resultados", "diagnostico_completo"]
        for estado in estados_a_limpiar:
            if estado in st.session_state:
                del st.session_state[estado]
# Mostrar el estilo de aprendizaje del usuario (si no es admin)
if not st.session_state.is_admin:
    estilo_usuario = obtener_estilo_aprendizaje(st.session_state.nombre_usuario)
    if estilo_usuario:
        st.info(f"🎓 Tu estilo de aprendizaje: **{estilo_usuario}** - La IA se adaptará a tu forma de aprender.")
        
        # Mostrar recomendaciones personalizadas
        with st.expander("💡 Recomendaciones de estudio personalizadas"):
            # Permitir especificar materia para recomendaciones más específicas
            materia_seleccionada = st.selectbox(
                "Selecciona una materia para recomendaciones específicas:",
                ["General", "Matemáticas", "Ciencias", "Historia", "Lenguaje", "Programación", "Otro"],
                key="materia_recomendaciones"
            )
            
            titulo, recomendaciones = obtener_recomendaciones_estudio(estilo_usuario, materia_seleccionada if materia_seleccionada != "General" else None)
            st.markdown(f"### {titulo}")
            for recomendacion in recomendaciones:
                st.markdown(f"• {recomendacion}")
            st.markdown("---")
            st.markdown("*Estas recomendaciones están adaptadas a tu estilo de aprendizaje para maximizar tu efectividad en el estudio.*")

if st.session_state.is_admin:  # Cualquier admin puede acceder al panel administrativo
    # ===== INTERFAZ DE ADMINISTRADOR =====
    st.markdown("---")
    st.markdown("## [MODO ADMINISTRADOR]")
    st.markdown("---")
    
    with st.sidebar:
        st.header("Panel Administrativo")
        if st.button("Cerrar Sesión"):
            st.session_state.autenticado = False
            st.session_state.is_admin = False
            st.session_state.messages = []
            st.rerun()
    
    # Tabs para administración
    tab_usuarios, tab_feedback, tab_stats, tab_metrics = st.tabs(["Usuarios", "Feedback", "Estadísticas", "Métricas de Usuario"])
    
    with tab_usuarios:
        st.subheader("Gestión de Usuarios")
        col1, col2 = st.columns(2)
        
        with col1:
            if st.button("Listar todos los usuarios"):
                usuarios = list(users_coll.find({}, {"_id": 0, "username": 1, "nombre": 1, "role": 1}))
                if usuarios:
                    st.dataframe(usuarios)
                else:
                    st.info("No hay usuarios registrados")
        
        with col2:
            if st.button("Total de usuarios"):
                total = users_coll.count_documents({})
                st.metric("Usuarios registrados", total)
        
        st.markdown("### Eliminar usuario")
        del_user = st.text_input("Username a eliminar")
        if st.button("Borrar usuario") and del_user:
            res = users_coll.delete_one({"username": del_user})
            if res.deleted_count:
                st.success(f"Usuario '{del_user}' eliminado")
            else:
                st.warning(f"No se encontró usuario '{del_user}'")
        
        st.markdown("### Promover a administrador")
        promo_user = st.text_input("Username para promover")
        if st.button("Convertir en admin") and promo_user:
            if promo_user == "TUTORADM":
                st.warning("TUTORADM ya es administrador")
            else:
                users_coll.update_one({"username": promo_user}, {"$set": {"role": "admin"}})
                st.success(f"Usuario '{promo_user}' ahora es administrador")

        st.markdown("### Quitar privilegios de administrador")
        demote_user = st.text_input("Username para quitar admin")
        if st.button("Quitar admin") and demote_user:
            if demote_user == "TUTORADM":
                st.error("No puedes quitarte los privilegios a ti mismo")
            else:
                users_coll.update_one({"username": demote_user}, {"$set": {"role": "user"}})
                st.success(f"Usuario '{demote_user}' ya no es administrador")
    
    with tab_feedback:
        st.subheader("Reportes y Feedback")
        if st.button("Ver todos los reportes"):
            feedbacks = list(feedback_coll.find({}, {"_id": 0}).sort("timestamp", -1))
            if feedbacks:
                for f in feedbacks:
                    timestamp_str = f['timestamp'].strftime('%Y-%m-%d %H:%M:%S') if isinstance(f['timestamp'], datetime) else str(f['timestamp'])
                    st.write(f"**{f['username']}** - [{f['tipo'].upper()}] - {timestamp_str}")
                    st.write(f"> {f['mensaje']}")
                    st.divider()
            else:
                st.info("No hay reportes")
    
    with tab_stats:
        st.subheader("Estadísticas")
        col1, col2, col3 = st.columns(3)
        
        with col1:
            total_users = users_coll.count_documents({})
            st.metric("Total usuarios", total_users)
        
        with col2:
            admin_count = users_coll.count_documents({"role": "admin"})
            st.metric("Administradores", admin_count)
        
        with col3:
            user_count = users_coll.count_documents({"role": "user"})
            st.metric("Usuarios normales", user_count)
        
        st.markdown("---")
        st.markdown("### Feedback por tipo")
        error_count = feedback_coll.count_documents({"tipo": "error"})
        suggestion_count = feedback_coll.count_documents({"tipo": "sugerencia"})
        other_count = feedback_coll.count_documents({"tipo": "otro"})
        
        col1, col2, col3 = st.columns(3)
        with col1:
            st.metric("Errores reportados", error_count)
        with col2:
            st.metric("Sugerencias", suggestion_count)
        with col3:
            st.metric("Otros", other_count)
        
        st.markdown("---")
        st.markdown("### 📊 Distribución de Estilos de Aprendizaje")
        
        # Obtener estadísticas de estilos de aprendizaje
        total_users_with_style = 0
        style_counts = {"Visual": 0, "Auditivo": 0, "Lector/Escritor": 0, "Kinestésico": 0}
        
        all_users = list(users_coll.find({"role": "user"}, {"learning_style": 1}))
        for user in all_users:
            style = user.get("learning_style")
            if style and style in style_counts:
                style_counts[style] += 1
                total_users_with_style += 1
        
        if total_users_with_style > 0:
            # Mostrar estadísticas
            col1, col2 = st.columns([1, 2])
            
            with col1:
                st.markdown("**Estadísticas:**")
                st.write(f"Total usuarios con diagnóstico: {total_users_with_style}")
                for style, count in style_counts.items():
                    percentage = (count / total_users_with_style) * 100
                    st.write(f"{style}: {count} ({percentage:.1f}%)")
            
            with col2:
                st.markdown("**Distribución visual:**")
                # Crear un gráfico simple con barras de texto
                max_count = max(style_counts.values()) if style_counts else 1
                for style, count in style_counts.items():
                    if count > 0:
                        bar_length = int((count / max_count) * 20)  # máximo 20 caracteres
                        bar = "█" * bar_length
                        percentage = (count / total_users_with_style) * 100
                        st.write(f"{style:15} {bar} {count} ({percentage:.1f}%)")
        else:
            st.info("Aún no hay usuarios que hayan completado el diagnóstico de estilo de aprendizaje.")
        
        st.markdown("---")
        st.markdown("### 📈 Insights y Recomendaciones")
        
        if total_users_with_style > 0:
            # Calcular el estilo más común
            estilo_mas_comun = max(style_counts, key=style_counts.get)
            porcentaje_mas_comun = (style_counts[estilo_mas_comun] / total_users_with_style) * 100
            
            st.markdown(f"**Estilo más común:** {estilo_mas_comun} ({porcentaje_mas_comun:.1f}% de usuarios)")
            
            # Recomendaciones basadas en la distribución
            insights = []
            
            if porcentaje_mas_comun > 60:
                insights.append(f"⚠️ La mayoría de usuarios ({porcentaje_mas_comun:.1f}%) tienen estilo {estilo_mas_comun}. Considera enfocarte en recursos para este estilo.")
            elif min(style_counts.values()) == 0:
                estilo_menos_comun = min(style_counts, key=style_counts.get)
                insights.append(f"💡 El estilo {estilo_menos_comun} tiene pocos usuarios. Podrías promover recursos para este estilo.")
            else:
                insights.append("✅ Buena distribución de estilos de aprendizaje en la plataforma.")
            
            # Calcular ratio de completitud del diagnóstico
            total_users = users_coll.count_documents({"role": "user"})
            completitud = (total_users_with_style / total_users) * 100 if total_users > 0 else 0
            insights.append(f"📊 {completitud:.1f}% de usuarios han completado el diagnóstico de estilo de aprendizaje.")
            
            if completitud < 50:
                insights.append("🎯 Considera recordar a los usuarios que completen el diagnóstico para personalizar mejor su experiencia.")
            
            for insight in insights:
                st.markdown(f"• {insight}")
        else:
            st.markdown("• Completa más diagnósticos de usuarios para obtener insights valiosos sobre la distribución de estilos de aprendizaje.")
    
    with tab_metrics:
        st.subheader("Métricas de Usuario")
        
        # Seleccionar usuario para ver métricas
        usuarios = list(users_coll.find({}, {"username": 1, "nombre": 1}))
        user_options = [f"{u['username']} - {u.get('nombre', 'Sin nombre')}" for u in usuarios]
        selected_user = st.selectbox("Seleccionar usuario", user_options)
        
        if selected_user:
            username = selected_user.split(" - ")[0]
            user_data = users_coll.find_one({"username": username})
            
            if user_data:
                col1, col2 = st.columns(2)
                
                with col1:
                    st.markdown("### Información básica")
                    st.write(f"**Username:** {user_data.get('username')}")
                    st.write(f"**Nombre:** {user_data.get('nombre')}")
                    st.write(f"**Rol:** {user_data.get('role')}")
                    st.write(f"**Total de logins:** {user_data.get('login_count', 0)}")
                    learning_style = user_data.get('learning_style')
                    if learning_style:
                        st.write(f"**Estilo de aprendizaje:** {learning_style}")
                    else:
                        st.write("**Estilo de aprendizaje:** No completado")
                
                with col2:
                    st.markdown("### Fechas")
                    created_at = user_data.get('created_at')
                    last_login = user_data.get('last_login')
                    
                    if created_at:
                        st.write(f"**Fecha de registro:** {created_at.strftime('%Y-%m-%d %H:%M:%S')}")
                        # Calcular cuánto tiempo lleva en el sistema
                        now = datetime.now()
                        time_in_system = now - created_at
                        days = time_in_system.days
                        hours = time_in_system.seconds // 3600
                        st.write(f"**Tiempo en sistema:** {days} días, {hours} horas")
                    else:
                        st.write("**Fecha de registro:** No disponible")
                    
                    if last_login:
                        st.write(f"**Última conexión:** {last_login.strftime('%Y-%m-%d %H:%M:%S')}")
                        # Calcular tiempo desde última conexión
                        now = datetime.now()
                        time_since_login = now - last_login
                        days_since = time_since_login.days
                        hours_since = time_since_login.seconds // 3600
                        st.write(f"**Tiempo desde última conexión:** {days_since} días, {hours_since} horas")
                    else:
                        st.write("**Última conexión:** Nunca")
                
                # Calcular frecuencia de conexión (aproximada)
                login_count = user_data.get('login_count', 0)
                if created_at and login_count > 1:
                    total_time = datetime.now() - created_at
                    days_total = total_time.days or 1  # evitar división por cero
                    avg_days_per_login = days_total / login_count
                    st.markdown("### Frecuencia de conexión")
                    st.write(f"**Promedio de días entre conexiones:** {avg_days_per_login:.1f}")
                    if avg_days_per_login < 1:
                        st.write("**Frecuencia:** Diaria")
                    elif avg_days_per_login < 7:
                        st.write("**Frecuencia:** Semanal")
                    elif avg_days_per_login < 30:
                        st.write("**Frecuencia:** Mensual")
                    else:
                        st.write("**Frecuencia:** Esporádica")
                elif login_count == 1:
                    st.markdown("### Frecuencia de conexión")
                    st.write("**Solo se ha conectado una vez**")
                else:
                    st.markdown("### Frecuencia de conexión")
                    st.write("**Nunca se ha conectado**")

else:
    # ===== INTERFAZ DE USUARIO NORMAL =====
    with st.sidebar:
        st.header("Panel de Control")
        
        # Opción para rehacer el test de diagnóstico
        if st.button("🔄 Cambiar estilo de aprendizaje"):
            # Activar flag para mostrar el test
            st.session_state.cambiar_estilo = True
            st.rerun()
        
        # Es fundamental usar la API Key de Google AI Studio (AIza...)
        api_key = st.text_input("Google API Key", type="password")

        # solicitar al servicio los modelos disponibles cuando haya clave
        model_choice = None
        if api_key and GEMINI_AVAILABLE:
            try:
                client = Client(api_key=api_key)
                resp = client.models.list()
                # resp is a Pager; convert to list or access its current page
                models_iter = None
                if hasattr(resp, "page"):
                    models_iter = resp.page
                else:
                    # fallback to iterating over resp directly
                    try:
                        models_iter = list(resp)
                    except Exception:
                        models_iter = []

                options = []
                for m in models_iter:
                    if isinstance(m, dict):
                        name = m.get("name")
                    else:
                        name = getattr(m, "name", None)
                    if name:
                        options.append(name)

                if options:
                    model_choice = st.selectbox("Modelo de IA", options, index=0)
                else:
                    st.warning("No se encontraron modelos disponibles con esta API Key.")
            except Exception as e:
                st.error(f"Error al listar modelos: {e}")
        elif not GEMINI_AVAILABLE:
            st.warning("La funcionalidad de IA no está disponible porque faltan dependencias. Instala langchain-google-genai para usar la IA.")

        archivo_subido = st.file_uploader("Carga tu material de estudio (PDF)", type="pdf")
        if st.button("Cerrar Sesión"):
            st.session_state.autenticado = False
            st.session_state.is_admin = False
            st.session_state.messages = []
            st.rerun()

        if api_key and model_choice:
            if st.button("Borrar historial (DB)"):
                chats_coll.delete_many({"username": st.session_state.nombre_usuario})
                st.success("Historial eliminado")
        
        st.markdown("---\n## Enviar solicitud o reporte")
        feedback_tipo = st.selectbox("Tipo", ["Sugerencia", "Error", "Otro"], key="feedback_tipo")
        feedback_msg = st.text_area("Mensaje", key="feedback_msg")
        if st.button("Enviar"):
            if feedback_msg.strip():
                enviar_feedback(st.session_state.nombre_usuario, feedback_tipo.lower(), feedback_msg)
                st.success("¡Gracias por tu feedback! Se ha enviado.")
            else:
                st.warning("Por favor, escribe un mensaje.")

def extraer_texto_pdf(pdf_file):
    reader = PdfReader(pdf_file)
    texto = ""
    for page in reader.pages:
        texto += page.extract_text() or ""
    return texto

# --- 7. CHAT Y PROCESAMIENTO CON GEMINI (Solo para usuarios normales) ---
if not st.session_state.is_admin:
    # Mostrar historial de mensajes
    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])

    if prompt := st.chat_input("Escribe tu duda aquí..."):
        if not api_key:
            st.error("Falta la Google API Key en la barra lateral.")
        elif not GEMINI_AVAILABLE:
            st.error("La funcionalidad de IA no está disponible. Instala langchain-google-genai para usar la IA.")
        else:
            # guardar mensaje de usuario en sesión y en la base de datos
            st.session_state.messages.append({"role": "user", "content": prompt})
            agregar_mensaje_chat(st.session_state.nombre_usuario, "user", prompt)
            with st.chat_message("user"):
                st.markdown(prompt)

            with st.chat_message("assistant"):
                try:
                    # seleccionar el modelo elegido o usar un valor por defecto
                    modelo_seleccionado = model_choice or "chat-bison-001"
                    llm = ChatGoogleGenerativeAI(
                        model=modelo_seleccionado,
                        google_api_key=api_key
                    )
                    
                    contexto = ""
                    if archivo_subido:
                        with st.spinner("Leyendo el PDF..."):
                            contexto = extraer_texto_pdf(archivo_subido)
                    
                    # Obtener el estilo de aprendizaje del usuario para personalizar la respuesta
                    estilo_usuario = obtener_estilo_aprendizaje(st.session_state.nombre_usuario)
                    
                    # Preparar la consulta con personalización según estilo de aprendizaje
                    mensaje_sistema_base = "Eres un tutor académico. Responde basándote en el contexto si existe."
                    
                    # Personalizar según el estilo de aprendizaje
                    if estilo_usuario:
                        personalizaciones = {
                            "Visual": "Como tutor, adapta tus explicaciones para estudiantes visuales: usa analogías visuales, describe diagramas mentales, sugiere crear mapas conceptuales, incluye referencias a imágenes o gráficos, y estructura la información de manera visual con listas, viñetas y formatos claros. Sugiere recursos visuales como videos, diagramas y gráficos.",
                            "Auditivo": "Como tutor, adapta tus explicaciones para estudiantes auditivos: explica conceptos en voz alta, sugiere discutir el tema con otros, recomienda grabar explicaciones, usa analogías sonoras, y fomenta el diálogo y la explicación verbal de conceptos. Sugiere recursos auditivos como podcasts, grabaciones y discusiones grupales.",
                            "Lector/Escritor": "Como tutor, adapta tus explicaciones para estudiantes lectores/escritores: proporciona textos detallados, listas de definiciones, resúmenes escritos, glosarios, y anima a tomar notas extensas, hacer resúmenes y leer material adicional. Sugiere recursos escritos como libros, artículos y documentación.",
                            "Kinestésico": "Como tutor, adapta tus explicaciones para estudiantes kinestésicos: sugiere actividades prácticas, experimentos, manipulaciones físicas, role-playing, y conecta el aprendizaje con experiencias concretas y aplicaciones reales. Sugiere recursos prácticos como experimentos, proyectos y actividades hands-on."
                        }
                        
                        mensaje_sistema = f"{mensaje_sistema_base}\n\n{personalizaciones[estilo_usuario]}\n\nEl estudiante tiene un estilo de aprendizaje {estilo_usuario}. Adapta tu enseñanza en consecuencia y sugiere recursos específicos que se alineen con este estilo."
                    else:
                        mensaje_sistema = mensaje_sistema_base
                    
                    if contexto:
                        # Limitamos el contexto para no saturar la memoria
                        contenido_final = f"PDF INFO:\n{contexto[:8000]}\n\nPREGUNTA: {prompt}"
                    else:
                        contenido_final = prompt

                    respuesta = llm.invoke([
                        SystemMessage(content=mensaje_sistema),
                        HumanMessage(content=contenido_final)
                    ])
                    
                    st.markdown(respuesta.content)
                    st.session_state.messages.append({"role": "assistant", "content": respuesta.content})
                    agregar_mensaje_chat(st.session_state.nombre_usuario, "assistant", respuesta.content)
                except Exception as e:
                    st.error(f"Error técnico: {e}")
                    