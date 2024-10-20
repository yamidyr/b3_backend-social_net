import { Schema, model } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const PublicationSchema = Shema({
    user_id:{
        type: Schema.ObjectId,
        ref: "User",
        required: true
    },
    text:{
        type: String,
        required: true
    },
    file: String,
    created_at:{
        type: Date,
        default: Date.now
    }
})

// Configurar el plugin de paginación
PublicationSchema.plugin(mongoosePaginate);

// Exportamos el modelo
export default model("Publication",PublicationSchema,"publications")