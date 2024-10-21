import User from '../models/users.js';
import bcrypt from 'bcrypt';

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
        return res.status(200).json({
            message: "Registro de usuario exitoso",
            params,
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