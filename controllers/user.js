// Método de pureba del controlador user
export const testUser = (req,res) => {
    return res.status(200).send({
        message: "Mensaje desde el controlador de Usuarios"
    });
};