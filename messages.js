const Texts = {

    regionals: [
        "🇦","🇧","🇨","🇩","🇪","🇫","🇬","🇭","🇮","🇯","🇰","🇱","🇲","🇳","🇴","🇵","🇶","🇷","🇸","🇹","🇺","🇻","🇼","🇽","🇾","🇿"
    ],

    reactions: [
        "💯", "😊", "❤", "✅", "🔥", "👌", "🤣", "⭐", "👍", "😎", "😍", "🤘", "👀", "🤙", "💪", "🤑", "🤔", "🤗", "😄",
    ],

    rejections: [
        "Naa",
        "No quiero",
        "NO",
        "Ni ganas bro",
        "Soy tu esclavo?",
        "Te creés crack?",
        "Nop.",
        "Dato",
        "Contame otro chiste",
        "Nope",
        "Nej",
        "No molestes"
    ],

    games: [
        "`connect4`: Cuatro en línea",
    ],

    help: {
        
        user: [
            "**__Ayuda sobre usuarios:__**",
            "`user (<usuario>)` muestra los datos de un usuario (default = los tuyos)",

            "`col (<usuario>)` muestra datos sobre toda la colección de un usuario (default = la tuya)",
            "`col (<usuario>) <pack>` muestra las cartas pertenecientes a un pack de un usuario (default = las tuyas)",
            "`top user` muestra los usuarios con más plata",

            "`bal (<usuario>)` muestra el balance de un usuario (default = el tuyo)",
            "`rolls`, `reacts`, `buys` y `invs` `(<usuario>)` muestran las acciones disponibles del usuario (default = las tuyas)",
            "`wait` muestra los minutos restantes para obtener más acciones",
            "`give <plata> <usuario>` le da plata a un usuario",

            "`id` muestra tu ID y los nombres asociados al mismo",
            "`id <nombre> (<id>)` asocia un nombre a una ID (default = la tuya)",
            "`id - <nombre>` elimina el nombre",
            "`id auto` asigna automáticamente tu username y tu nickname a tu ID",
            "`id list` muestra todos los IDs y los nombres asociados a cada uno",
            "",
            "`u` es equivalente a `user`",
        ],

        card: [
            "**__Ayuda sobre cartas:__**",
            "`card <pack> <número>` muestra una carta específica de una pack",

            "`roll` muestra una carta al azar que se puede comprar si no es de nadie",
            "`inv <pack> <número>` invierte plata en la carta y aumenta su multiplicador (cuesta lo que vale la carta)",
            "`sell <pack> <número>` vende una carta por la mitad de su valor",
            "`sell <pack> all` vende todas las cartas de una colección por la mitad de sus valores",
            "`give <pack> <número> <usuario>` le da esa carta a otro usuario",
            "`rename <pack> <número> <nombre>` renombra la carta (tiene que ser tuya)",

            "`prev` muestra la carta anterior del mismo pack",
            "`next` muestra la carta siguiente del mismo pack",
            "`top cards` muestra las 10 cartas más valiosas",

            "`pack <pack>` muestra las cartas de un pack",
            "`pack list` muestra una lista de todos los packs",
            "",
            "`c` es equivalente a `card`",
            "`r` es equivalente a `roll`",
            "`p` es equivalente a `prev`",
            "`n` es equivalente a `next`",
        ],

        all: [
            "`< >` indica un **parámetro** de una lista o dado por el usuario",
            "`( )` indica un parámetro **opcional**",
            "`prefix <prefijo>` cambia el **prefijo** de los comandos",
            "`help` muestra la **ayuda** general",
            "",
            "`help new` muestra los comandos más **nuevos**",
            "`help card` muestra los comandos relacionados a **cartas**",
            "`help user` muestra los comandos relacionados a **usuarios**",
            "`help game` muestra los comandos relacionados a **juegos**",
            "`help cmd` muestra los comandos relacionados a comandos **personalizados**",
            "`help bot` muestra los comandos relacionados al **bot**",
            "",
            "`h` es equivalente a `help`",
            "`c` es equivalente a `card`",
            "`u` es equivalente a `user`",
        ],

        new: [
            "**__Comandos nuevos:__**",
            "Ahora no hace falta borrar el texto posterior a '.png' (por ejemplo) al agregar imágenes",
            "Los comandos principales ahora pueden escribirse en mayúsculas también",
            "`wait` muestra los minutos restantes para obtener más acciones"
        ],

        cmd: [
            "**__Ayuda sobre comandos personalizados:__**",
            "`+ <cmd>` agrega un comando personalizado",
            "`- <cmd>` elimina un comando personalizado",
            "`list` muestra todos los comandos personalizados",
            "",
            "`<cmd> list` muestra todos las opciones del comando",
            "`<cmd> <número>` muestra una opción específica del comando",
            "`<cmd>` muestra una opción al azar del comando",
            "`<cmd> + <opción>` agrega una opción al comando",
            "`<cmd> + <cantidad> gifs (<término de búsqueda>)` agrega gifs según el término de búsqueda (default = `<cmd>`)",
            "`<cmd> + <cantidad> imgs (<término de búsqueda>)` agrega imágenes según el término de búsqueda (default = `<cmd>`)",
            "`<cmd> - <número de opción>` remueve una opción específica del comando",
            "`<cmd> - all` remueve todas las opciones del comando",
            "`<cmd> - last` remueve la última opción que se mostró del comando",
            "`<cmd> -` remueve la última opción del comando",
        ],

        game: [
            "**__Ayuda sobre juegos:__**",
            "`game <juego>` inicia una partida del juego seleccionado",
            "`game list` muestra todos los juegos disponibles",
        ],

        bot: [
            "**__Ayuda sobre el bot:__**",
            "`save` guarda todos los datos permanentemente",
            "`reset` resetea la conexión entre el bot y Discord",
            "`prefix <prefijo>` establece un nuevo prefijo para comandos",
            "`exit (nosave)` apaga el bot y guarda los datos a menos que se escriba 'nosave'",
            "`config` muestra la configuración actual",
        ],

    },

}

Texts.help.c = Texts.help.card
Texts.help.u = Texts.help.user

module.exports = Texts;