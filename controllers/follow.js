import User from '../models/users.js';
import Follow from '../models/follows.js';
import { ensureAuth } from "../middlewares/auth.js";


// Método de pureba del controlador follow
export const testFollow = (req,res) => {
    return res.status(200).send({
        message: "Mensaje desde el controlador de Follow"
    });
};

// // Método para guardar un follow ( seguir a otro usuario )
// export const saveFollow = async (req, res) => {
//     try {
        
//     } catch (error) {
        
//     }
// }