# TutorIAndo 🎓

Plataforma de tutoría inteligente con IA personalizada según estilos de aprendizaje.

## ✨ Características Principales

### 🤖 IA Personalizada por Estilo de Aprendizaje
- **Diagnóstico automático**: Test VARK de 5 preguntas para identificar estilos de aprendizaje
- **Estilos soportados**: Visual, Auditivo, Lector/Escritor, Kinestésico
- **IA adaptativa**: ChatGPT personaliza respuestas según tu estilo de aprendizaje
- **Recomendaciones inteligentes**: Sugerencias específicas de recursos y técnicas de estudio

### 👥 Sistema de Usuarios
- **Roles**: Usuario normal y Administrador
- **Persistencia**: MongoDB para usuarios, chats y feedback
- **Métricas**: Seguimiento de tiempo en plataforma y frecuencia de uso

### 📊 Panel Administrativo
- **Gestión de usuarios**: Crear, eliminar y promocionar usuarios
- **Estadísticas avanzadas**: Distribución de estilos de aprendizaje
- **Feedback system**: Reportes y sugerencias de usuarios
- **Insights inteligentes**: Recomendaciones basadas en datos

## 🚀 Instalación Rápida

### Prerrequisitos
- Python 3.8+
- MongoDB (local o en la nube)
- Node.js (opcional, para backend)

### Instalación
```bash
# Clonar repositorio
git clone <repository-url>
cd tutorIAndo

# Crear entorno virtual
python -m venv .venv
.\.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # Linux/Mac

# Instalar dependencias
pip install -r requirements.txt

# O instalar manualmente
pip install streamlit pymongo PyPDF2 langchain-google-genai google-genai
```

### Configuración
```bash
# Configurar MongoDB
export MONGO_URI="mongodb://localhost:27017"
# O crear archivo .env con: MONGO_URI=mongodb://localhost:27017
```

### Ejecución
```bash
# Iniciar aplicación
streamlit run Main.py

# Backend opcional
npm install
npm run dev
```

## 🎯 Uso de la Aplicación

### Para Nuevos Usuarios
1. **Registro**: Crear cuenta con nombre y contraseña
2. **Diagnóstico**: Completar test de estilo de aprendizaje (obligatorio)
3. **Personalización**: Recibir recomendaciones específicas
4. **IA Adaptada**: Usar chat con respuestas personalizadas

### Para Administradores
- **TUTORADM**: Usuario administrador principal
- **Gestión**: Panel completo de administración
- **Estadísticas**: Análisis de usuarios y estilos de aprendizaje
- **Feedback**: Revisar reportes y sugerencias

## 🧠 Estilos de Aprendizaje Soportados

### 👁️ Visual
- Prefiere diagramas, gráficos y representaciones visuales
- Recomendaciones: Mapas mentales, videos, flashcards

### 🎧 Auditivo
- Aprende mejor escuchando y discutiendo
- Recomendaciones: Podcasts, grabaciones, grupos de estudio

### 📖 Lector/Escritor
- Excelente con textos y escritura
- Recomendaciones: Libros, artículos, resúmenes escritos

### 👐 Kinestésico
- Aprende haciendo y experimentando
- Recomendaciones: Experimentos, proyectos prácticos, role-playing

## 📋 Dependencias

```
streamlit>=1.28.0
pymongo>=4.6.0
PyPDF2>=3.0.0
langchain-google-genai>=1.0.0  # Opcional para IA
google-genai>=0.1.0            # Opcional para IA
```

## 🔧 Solución de Problemas

### Error de dependencias
```bash
# Reinstalar entorno virtual
rm -rf .venv
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
```

### MongoDB no conectado
- Verificar que MongoDB esté ejecutándose
- Comprobar MONGO_URI
- Revisar conexión de red

### IA no funciona
- Verificar API key de Google AI Studio
- Instalar dependencias opcionales si faltan
- La aplicación funciona sin IA (solo diagnóstico y recomendaciones)

## 📈 Roadmap

- [ ] Integración con más modelos de IA
- [ ] Sistema de badges y gamificación
- [ ] Análisis avanzado de progreso estudiantil
- [ ] Recursos multimedia integrados
- [ ] API REST completa

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama para feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.
