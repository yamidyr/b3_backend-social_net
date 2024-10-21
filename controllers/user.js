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

// Método para mostrar el perfiil de un usuario
export const profile = async (req, res ) => {
    try {
        // Obtener el ID del usuario desde los parámetros de la URL
        const userId = req.params.id;

        // Verificar si el ID del usuario autenticado está disponible
        if(!req.user || !req.user.userId){
            return res.status(401).send({
                status: "success",
                message: "Usuario no autenticado"
            })
        }

        // Buscar el usuario en la BD y excluimos los datos que no queremos mostrar
        const userProfile = await User.findById(userId).select('-password -role -email -__v');

        // Verificar si el usuario buscado no existe
        if(!userProfile){
            return res.status(404).send({
                status: "success",
                message: "Usuario no encontrado"
            });
        }

        // Devolver la información del perfil del usuario solicitado
        return res.status(200).json({
            status: "success",
            user: userProfile
        })


    } catch (error) {
        console.log("Error al obtener el perfil del usuario: "  , error);
        return res.status(500).send({
            status: "error",
            message: "Error al obtener el perfil del usuario"
        })
    }
}

//Método para listar usuarios
export const listUsers = async (req,res) => {
    try {
        // Gestionar la paginación
        // 1. Controlar la página actual
        let page = req.params.page ? parseInt(req.params.page, 10) : 1;

        // 2. Configurar los items por página a mostrar
        let itemsPerPage = req.query.limit ? parseInt(req.query.limit, 10) : 4;

        // Realizar consulta paginada
        const options = {
            page: page,
            limit: itemsPerPage,
            select: '-password -email -role -__v'
        };
        const users = await User.paginate({}, options);

        // Si no existen usuarios en la BD disponibles
        if(!users || users.docs.length === 0){
            return res.status(404).send({
                status: "error",
                message: "No existen usuarios disponibles"
            });
        }

        // Devolver los usuarios paginados
        return res.status(200).json({
            status: "success",
            users: users.docs,
            totalDocs: users.totalDocs,
            totalPages: users.totalPages,
            cancelIdleCallbackurrentPage: users.page
        })

    } catch (error) {
        console.log("Error al listar los usuarios: ", error);
        return res.status(500).send({
            status: "error",
            message: "Error al listar los usuarios"
        })
    }
}