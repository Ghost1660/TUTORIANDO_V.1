import sqlite3

def crear_base_datos():
    conexion = sqlite3.connect('tutorIAndo.db')
    cursor = conexion.cursor()
    
    # Tabla de usuarios
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    ''')
    
    # Nueva tabla para el historial de chat
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS mensajes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            rol TEXT NOT NULL,
            contenido TEXT NOT NULL,
            fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (username) REFERENCES usuarios (username)
        )
    ''')
    
    conexion.commit()
    conexion.close()

def guardar_usuario_db(nombre, username, password):
    try:
        conexion = sqlite3.connect('tutorIAndo.db')
        cursor = conexion.cursor()
        cursor.execute('INSERT INTO usuarios (nombre, username, password) VALUES (?, ?, ?)', 
                       (nombre, username, password))
        conexion.commit()
        conexion.close()
        return True, "Registro exitoso."
    except sqlite3.IntegrityError:
        return False, "El nombre de usuario ya existe."

def validar_usuario_db(username, password):
    conexion = sqlite3.connect('tutorIAndo.db')
    cursor = conexion.cursor()
    cursor.execute('SELECT nombre FROM usuarios WHERE username = ? AND password = ?', 
                   (username, password))
    resultado = cursor.fetchone()
    conexion.close()
    return (True, resultado[0]) if resultado else (False, None)

# --- FUNCIONES PARA EL CHAT ---
def guardar_mensaje_db(username, rol, contenido):
    conexion = sqlite3.connect('tutorIAndo.db')
    cursor = conexion.cursor()
    cursor.execute('INSERT INTO mensajes (username, rol, contenido) VALUES (?, ?, ?)', 
                   (username, rol, contenido))
    conexion.commit()
    conexion.close()

def obtener_historial_db(username):
    conexion = sqlite3.connect('tutorIAndo.db')
    cursor = conexion.cursor()
    cursor.execute('SELECT rol, contenido FROM mensajes WHERE username = ? ORDER BY fecha ASC', (username,))
    mensajes = [{"role": row[0], "content": row[1]} for row in cursor.fetchall()]
    conexion.close()
    return mensajes