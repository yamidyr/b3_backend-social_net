import User from '../models/users.js';
import bcrypt from 'bcrypt';
import { createToken } from '../services/jwt.js';

// Método de pureba del controlador user
export const testUser = (req,res) => {
    return res.status(200).send({
        message: "Mensaje desde el controlador de Usuarios"
    });
};

// Método de registro de usuarios
export const register = async (req, res) => {
    try {
        // Obtener los datos de la petición
        let params = req.body;

        // Validar los datos obtenidos (que los datos obligatorios obligatorios existan)
        if( !params.name || !params.last_name || !params.nick || !params.email || !params.password){
            return res.status(400).json({
                status: "error",
                message: "Faltan datos por enviar"
            })
        }

        // Crear el objeto del usuario con los datos  que validamos
        let user_to_save = new User(params);

        // Control de usuarios duplicados
        const existingUser = await User.findOne({
            $or: [
                { email: user_to_save.email.toLowerCase() },
                { nick: user_to_save.nick.toLowerCase()}
            ]
        });

        //Validar existingUser
        if( existingUser ){
            return res.status(409).send({
                status: "success",
                message: "El usuario ya existe en la base de datos"
            })
        }

        // Cifrar la contraseña
        // Genera los saltos para encriptar
        const salt = await bcrypt.genSalt(10);

        // Encripta la contraseña y guarda en hashedPassword
        const hashedPassword = await bcrypt.hash(user_to_save.password,salt);

        //Asignar la contraseña encriptada al objeto del usuario
        user_to_save.password = hashedPassword;


        // guardar el usuario en base de datos
        await user_to_save.save();

        // Devolver el usuario registrado
        return res.status(201).json({
            status: "created",
            message: "Registro de usuario exitoso",
            user_to_save
        })


    } catch (error) {
        console.log("Error en el registro de usuario: ", error);
        return res.status(500).send({
            status: "error",
            message: "Error en el registro de usuario"
        })
    }
};

// Método de Login ( usar JWT)
export const login = async (req,res) => {
    try {

        // Obtener los parámetros del body (enviados en la petición)
        let params = req.body;

        // Validar que sí recibimos el email y el password
        if ( !params.email || !params.password){
            return res.status(400).send({
                status: "error",
                message: "Faltan datos por enviar"
            });
        }

        // Buscar en la BD si existe el email registrado
        const userBD = await User.findOne({
            email: params.email.toLowerCase()
        });

        // Si no existe el usuario buscado
        if(!userBD){
            return res.status(404).send({
                status: "error",
                message: "Usuario no encontrado"
            });
        }

        // Comprobar la contraseña
        const validPassword = await bcrypt.compare(params.password, userBD.password);

        // Si la contraseña es incorrecta (false)
        if(!validPassword){
            return res.status(401).send({
                status: "error",
                message: "Contraseña incorrecta"
            })
        }

        // Generar el token de autenticación (JWT)
        const token = createToken(userBD);


        // Devolver respuesta de login exitoso
        return res.status(200).json({
            status: "success",
            message: "Autenticación exitosa",
            token,
            userBD: {
                id: userBD._id,
                name: userBD.name,
                last_name: userBD.last_name,
                email: userBD.email,
                nick: userBD.nick,
                image: userBD.image
            }
        })
    } catch (error) {
        console.log("Error en la autenticación del usuario: ", error);
        return res.status(500).send({
            status: "error",
            message: "Error en la autenticación del usuario"
    })
    }
};