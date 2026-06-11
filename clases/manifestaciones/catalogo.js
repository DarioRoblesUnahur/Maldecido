const CATALOGO = [
  { id: "jaguares", nombre: "Jaguares Espectrales", icon: "🐆", desc: "Felinos que orbitan y dañan al contacto.", clase: JaguaresEspectrales, totem: false },
  { id: "veneno",   nombre: "Bolas de Veneno",      icon: "🟢", desc: "Orbes que estallan en charcos venenosos.", clase: BolasDeVeneno, totem: false },
  { id: "condor",   nombre: "Cóndor Vigía",          icon: "🦅", desc: "Picada automática a un enemigo cercano.", clase: CondorVigia, totem: false },
  { id: "huaca",    nombre: "Estallido de Huaca",    icon: "💥", desc: "Onda expansiva que empuja a los enemigos.", clase: EstallidoDeHuaca, totem: false },
  { id: "fuego",    nombre: "Tótem de Fuego",        icon: "🔥", desc: "+10% de daño por nivel.", clase: TotemFuego, totem: true },
  { id: "tierra",   nombre: "Tótem de Tierra",       icon: "🪨", desc: "+10% de defensa por nivel.", clase: TotemTierra, totem: true },
  { id: "aire",     nombre: "Tótem de Aire",         icon: "🌪", desc: "+10% de velocidad por nivel.", clase: TotemAire, totem: true },
  { id: "agua",     nombre: "Tótem de Agua",         icon: "💧", desc: "+ regeneración de vida por nivel.", clase: TotemAgua, totem: true },
];

const EVOLUCIONES = {
  jaguares: { totem: "fuego",  nombre: "Jaguares Infernales", icon: "🔥", desc: "Aro de fuego que quema y empuja." },
  veneno:   { totem: "tierra", nombre: "Avalancha de Veneno", icon: "☣", desc: "Charcos enormes y persistentes." },
  condor:   { totem: "aire",   nombre: "Espíritu Aéreo",      icon: "💨", desc: "Picadas más amplias y potentes." },
  huaca:    { totem: "agua",   nombre: "Marca de la Huaca",   icon: "🌊", desc: "Deja marcas que explotan en el suelo." },
};

function metaDe(id) { return CATALOGO.find(c => c.id === id); }
