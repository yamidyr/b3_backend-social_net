import Publication from '../models/publications.js';
import { followUserIds } from '../services/followServices.js';

// Método de pureba del controlador publication
export const testPublication = (req,res) => {
    return res.status(200).send({
        message: "Mensaje desde el controlador de Publication"
    });
};

// Método para hacer (guardar en la BD) una publicación
export const savePublication = async (req,res) => {
    try {
        // Obtenermos los datos del boddy
        const params = req.body;

        // Verificamos que llegue desde el body el parámetro text con su información
        if(!params.text){
            return res.status(400).send({
                status: "error",
                message: "Debes enviar el texto de la publicación."
            });
        }

        // Crear el objeto del modelo
        let newPublication = new Publication(params);

        // Agregar al objeto de la publicación la información del usuario autenticado quien crea la publicación.
        newPublication.user_id = req.user.userId;

        // Guardar la nueva publicación en la BD
        const publicationStored = await newPublication.save();

        // Verificar que se guardó la nueva publicación en la BD ( si existe publicationStored )
        if( !publicationStored){
            return res.status(500).send({
                status: "error",
                message: "No se ha guardado la publicación"
            });
        }

        // Devolver respuesta exitosa
        return res.status(200).json({
            status: "success",
            message: "¡Publicación realizada con éxito!",
            publicationStored
        });

    } catch (error) {
        console.log("Error al crear la publicación: ", error);
        return res.status(500).send({
            status: "error",
            message: "Error al crear la publicación."
        })
    }
};

// Método para mostrar la publicación
export const showPublication = async (req,res) => {
    try {
        // Obtener el ID de la publicación desde la url (parámetros)
        const publicationId = req.params.id;

        // Buscar la publicación en la BD por Id
        const publicationStored = await Publication.findById(publicationId).populate('user_id','name last_name nick image');

        // Verificar si existe la publicación en la BD
        if(!publicationStored){
            return res.status(404).send({
                status: "error",
                message: "No existe la publicación"
            });
        }


        // Devolvemos respuesta exitosa
        return res.status(200).json({
            status: "success",
            message: "Publicación encontrada.",
            publication: publicationStored
        });

    } catch (error) {
        console.log("Error al mostrar la publicaión: ", error)
        return res.status(500).send({
            status: "error",
            message: "Error al mostrar la publicaión"
        });
    }
};

// Método para eliminar una publicación
export const deletePublication = async (req,res) => {
try {
    // Obtener el ID de la publicación desde la url (parámetros)
    const publicationId = req.params.id;

    // Buscar la publicación en la BD por Id y la eliminamos
    const publicationDeleted = await Publication.findOneAndDelete({ user_id: req.user.userId, _id: publicationId}).populate('user_id','name last_name');

    // Verificar si existe la publicación en la BD y si se eliminó de la BD
    if(!publicationDeleted){
        return res.status(404).send({
            status: "error",
            message: "No se ha encontrado o no tienes permiso para eliminar esta publicación"
        });
    }


    // Devolvemos respuesta exitosa
    return res.status(200).json({
        status: "success",
        message: "Publicación eliminada con éxito.",
        publication: publicationDeleted
    });
} catch (error) {
    return res.status(500).send({
        status: "error",
        message: "Error al eliminar una publicación"
    });
}
};

// Método para listar publicaciones de un usuario en particular, enviándole el id del usuario en los parámetros de la URL de la petición ( endpoint)
export const publicationsUser = async ( req, res ) => {
    try {
        // Obtener el ID del usuario
        const userId = req.params.id;

        // Asignar el número de página a mostrar inicialmente
        let page = req.params.page ? parseInt(req.params.page, 10) : 1;

        // Número de publicaciones que queremos mostrar por página
        let itemsPerPage = req.params.page ? parseInt(req.params.page, 10) : 5;

        // Opciones para la consulta
        const options = {
            page: page,
            limit: itemsPerPage,
            sort: { created_at: -1 },
            populate: {
                path: 'user_id',
                select: '-password -role -__v -email'
            },
            lean: true
        };

        // Buscar las publicaciones del usuario
        const publications = await Publication.paginate({ user_id: userId }, options);

        // Verificar si existen publicaciones
        if(!publications.docs || publications.docs.length <= 0){
            return res.status(404).send({
                status: "error",
                message: "No hay publicaciones para mostrar"
            });
        }

        // Devolver respuesta exitosa
        return res.status(200).json({
            status: "success",
            message: "Publicaciones del usuario: ",
            publications: publications.docs,
            total: publications.totalDocs,
            pages: publications.totalPages,
            page: publications.page, // pagina actual
            limit_item_ppage: publications.limit
        });
    } catch (error) {
        console.log("Error al mostrar las publicaciones: ", error);
        return res.status(500).send({
            status: "error",
            message: "Error al mostrar las publicaciones"
        });
    }
}

// Método para subir imágenes a las publicaciones
export const uploadMedia = async (req, res)  => {
    try {
        // Obtener el ID de la publicación
        const publicationId = req.params.id;

        // Verificar si la publicación existe en la BD
        const publicationExists = await Publication.findById(publicationId);

        if(!publicationExists){
            return res.status(404).send({
                status: "error",
                message: "No existe la publicación."
            });
        }

        // Verificar si se ha recibido un archivo
        if(!req.file){
            return res.status(400).send({
                status: "error",
                message: "La petición no incluye la imagen."
            });
        }

        // Obtenemos la URL de Cloudinary
        const mediaUrl = req.file.path;

        // Actualizar la publicación con la URL de la imagen
        const publicationUpdated = await Publication.findByIdAndUpdate(
            publicationId,
            { file: mediaUrl },
            { new: true }
        );

        if(!publicationUpdated){
            return res.status(500).send({
                status: "error",
                message: "Error en la subidda de la imagen"
            });
        };

        // Devolver respuesta exitosa
        return res.status(200).json({
            status: "success",
            message: "Archivo subido con éxito",
            publication: publicationUpdated,
            file: mediaUrl
        });

    } catch (error) {
        console.log("No se pudo subir la publicación: " , error);
        return res.status(500).send({
            status: "error",
            message: "No se pudo subir la publicación."
        });
    }
};