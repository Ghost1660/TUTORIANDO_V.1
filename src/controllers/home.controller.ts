const homeController = {
  home: (req, res) => {
    res.json({
      message: "TutorIAndo backend funcionando correctamente",
      status: "ok",
    });
  },
};

export default homeController;