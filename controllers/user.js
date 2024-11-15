import User from '../models/users.js';
import Follow from '../models/follows.js';
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

// Método para mostrar el perfil de un usuario
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

// Método para listar usuarios
export const listUsers = async (req,res) => {
    try {
        // Gestionar la paginación
        // 1. Configurar la página actual
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
            cancelIdleCallbackCurrentPage: users.page
        })

    } catch (error) {
        console.log("Error al listar los usuarios: ", error);
        return res.status(500).send({
            status: "error",
            message: "Error al listar los usuarios"
        })
    }
}

// método para actualizar los datos del usuario
export const updateUser = async (req, res ) => {
    try {

        // Obtener la información del usuario a actualizar
        let userIdentity = req.user; // el usuario autenticado en el token, lo trae desde el middleware
        let userToUpdate = req.body; // recoge los datos nuevos del usuario desde el formulario

        // Eliminar campos que sobran porque no los vamos a actualizar
        delete userToUpdate.iat;
        delete userToUpdate.exp;
        delete userToUpdate.role;

        // Comprobamos si el usuario ya existe en la BD
        const users = await User.find({
            $or: [
                { email: userToUpdate.email },
                { nick: userToUpdate.nick}
            ]
        }).exec();

        // Verificamos si el usuario está duplicado para evitar confilctos
        const isDuplicatedUser = users.some(user => {
            return user && user._id.toString()!== userIdentity.userId;
        });

        if(isDuplicatedUser){
            return res.status(400).send({
                status: "error",
                message: "Error, solo se puede actualizar los datos del usuario logueado"
            });
        }

        // Cifrar la contraseña en caso que la envíen en la petición
        if(userToUpdate.password){
            try {
                let pwd = await bcrypt.hash(userToUpdate.password, 10);
                userToUpdate.password = pwd;
            } catch (hashError) {
                return res.status(500).send({
                    status: "error",
                    message: "Error al cifrar la contraseña"
                });
            }
        } else {
            delete userToUpdate.password;
        }

        // Buscar y actualizar el usuario en Mongo
        let userUpdated = await User.findByIdAndUpdate(userIdentity.userId, userToUpdate, { new: true} );
        if( !userUpdated ){
            return res.status(400).send({
                status: "error",
                message: "Error al actualizar el usuario"
            })
        }

        // Devolvemos la respuesta exitosa
        return res.status(200).json({
            status: "success",
            message: "Usuario actualizado correctamente",
            user: userUpdated
        })
    } catch (error) {
        console.log("Error al actualizar los datos del usuario");
        return res.status(500).send({
            status: "error",
            message: "Error al actualizar los datos del usuario"
        })
    }
}

// Método para subir AVATAR (imagen de perfil) y actualizamos el campo imagen del User
export const uploadAvatar = async (req,res) => {
    try {
        // Verificar si se ha subido un archivo
        if(!req.file){
            return res.status(400).send({
                status: "error",
                message: "Error la petición no incluye la imagen"
            });
        }

        // Obtener la URL del archivo subido en Cloudinary
        const avatarUrl = req.file.path;

        // Guardar la imagen en la BD
        const userUpdated = await User.findByIdAndUpdate(
            req.user.userId,
            { image: avatarUrl },
            { new: true }
        );

        // Verificar si la actualización fue exitosa
        if(!userUpdated){
            return res.status(500).send({
                status: "error",
                message: "Error al subir el archivo del avatar"
            });
        }

        // Devolver una respuesta exitosa
        return res.status(200).json({
            status: "success",
            user: userUpdated,
            file: avatarUrl
        })
    } catch (error) {
        console.log("Error al subir archivos", error);
        return res.status(500).send({
            status: "error",
            message: "Error al subir el archivo del avatar"
        });
    }
}

// Método para mostrar el AVATAR
export const avatar = async (req,res) => {
    try {
        // Obtener el ID desde el parámetro del archivo  desde la url
        const userId = req.params.id;

        //  Buscar el usuario en la base de datos para obtener la URL de Cloudinary
        const user = await User.findById(userId).select('image');

        // Verificar si el usuario existe y tiene una imagen
        if(!user || !user.image ){
            return res.status(500).send({
                status: "error",
                message: "No existe usuario o image"
            });
        }

        // Redirigir a la URL de la imagen en Cloudinary
        return res.redirect(user.image);

        // Devolver la URL de la imagen desde cloudinary
        return res.status(200).send({
            status: "success",
            imageUrl: user.image // URL de Cloudinary
        });
    } catch (error) {
        console.log("Error al subir archivos", error);
        return res.status(500).send({
            status: "error",
            message: "Error al mostrar el archivo del avatar"
        });
    }
}

// Método para mostrar contador de seguidores y publicaciones
export const counters = async (req, res) => {
    try {
      // Obtener el Id del usuario autenticado (token)
      let userId = req.user.userId;
  
  
      // Si llega el id a través de los parámetros en la URL tiene prioridad
      if(req.params.id){
        userId = req.params.id;
      }
  
      // Obtener el nombre y apellido del usuario
      const user = await User.findById(userId, { name: '1', last_name: '1'});
  
  
  
      // Vericar el user
      if(!user){
        return res.status(404).send({
          status: "error",
          message: "Usuario no encontrado"
        });
      }
  
      // Contador de usuarios que yo sigo (o que sigue el usuario autenticado)
      const followingCount = await Follow.countDocuments({ "following_user": userId });
  
      // Contador de usuarios que me siguen a mi (que siguen al usuario autenticado)
      const followedCount = await Follow.countDocuments({ "followed_user": userId });
  
      // Contador de publicaciones del usuario autenticado
      const publicationsCount = await Publication.countDocuments({ "user_id": userId });
  
      // Devolver los contadores
      return res.status(200).json({
        status: "success",
        userId,
        name: user.name,
        last_name: user.last_name,
        followingCount: followingCount,
        followedCount: followedCount,
        publicationsCount: publicationsCount
      });
  
    } catch (error) {
      console.log("Error en los contadores", error)
      return res.status(500).send({
        status: "error",
        message: "Error en los contadores"
      });
    }
  }