const Texts = {

    regionals: [
        "๐ฆ","๐ง","๐จ","๐ฉ","๐ช","๐ซ","๐ฌ","๐ญ","๐ฎ","๐ฏ","๐ฐ","๐ฑ","๐ฒ","๐ณ","๐ด","๐ต","๐ถ","๐ท","๐ธ","๐น","๐บ","๐ป","๐ผ","๐ฝ","๐พ","๐ฟ"
    ],

    reactions: [
        "๐ฏ", "๐", "โค", "โ", "๐ฅ", "๐", "๐คฃ", "โญ", "๐", "๐", "๐", "๐ค", "๐", "๐ค", "๐ช", "๐ค", "๐ค", "๐ค", "๐",
    ],

    rejections: [
        "Naa",
        "No quiero",
        "NO",
        "Ni ganas bro",
        "Soy tu esclavo?",
        "Te creรฉs crack?",
        "Nop.",
        "Dato",
        "Contame otro chiste",
        "Nope",
        "Nej",
        "No molestes"
    ],

    games: [
        "`connect4`: Cuatro en lรญnea",
    ],

    help: {
        
        user: [
            "**__Ayuda sobre usuarios:__**",
            "`user (<usuario>)` muestra los datos de un usuario (default = los tuyos)",

            "`col (<usuario>)` muestra datos sobre toda la colecciรณn de un usuario (default = la tuya)",
            "`col (<usuario>) <pack>` muestra las cartas pertenecientes a un pack de un usuario (default = las tuyas)",
            "`top user` muestra los usuarios con mรกs plata",

            "`bal (<usuario>)` muestra el balance de un usuario (default = el tuyo)",
            "`rolls`, `reacts`, `buys` y `invs` `(<usuario>)` muestran las acciones disponibles del usuario (default = las tuyas)",
            "`wait` muestra los minutos restantes para obtener mรกs acciones",
            "`give <plata> <usuario>` le da plata a un usuario",

            "`id` muestra tu ID y los nombres asociados al mismo",
            "`id <nombre> (<id>)` asocia un nombre a una ID (default = la tuya)",
            "`id - <nombre>` elimina el nombre",
            "`id auto` asigna automรกticamente tu username y tu nickname a tu ID",
            "`id list` muestra todos los IDs y los nombres asociados a cada uno",
            "",
            "`u` es equivalente a `user`",
        ],

        card: [
            "**__Ayuda sobre cartas:__**",
            "`card <pack> <nรบmero>` muestra una carta especรญfica de una pack",

            "`roll` muestra una carta al azar que se puede comprar si no es de nadie",
            "`inv <pack> <nรบmero>` invierte plata en la carta y aumenta su multiplicador (cuesta lo que vale la carta)",
            "`sell <pack> <nรบmero>` vende una carta por la mitad de su valor",
            "`sell <pack> all` vende todas las cartas de una colecciรณn por la mitad de sus valores",
            "`give <pack> <nรบmero> <usuario>` le da esa carta a otro usuario",
            "`rename <pack> <nรบmero> <nombre>` renombra la carta (tiene que ser tuya)",

            "`prev` muestra la carta anterior del mismo pack",
            "`next` muestra la carta siguiente del mismo pack",
            "`top cards` muestra las 10 cartas mรกs valiosas",

            "`pack <pack>` muestra las cartas de un pack",
            "`pack list` muestra una lista de todos los packs",
            "",
            "`c` es equivalente a `card`",
            "`r` es equivalente a `roll`",
            "`p` es equivalente a `prev`",
            "`n` es equivalente a `next`",
        ],

        all: [
            "`< >` indica un **parรกmetro** de una lista o dado por el usuario",
            "`( )` indica un parรกmetro **opcional**",
            "`prefix <prefijo>` cambia el **prefijo** de los comandos",
            "`help` muestra la **ayuda** general",
            "",
            "`help new` muestra los comandos mรกs **nuevos**",
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
            "Ahora no hace falta borrar el texto posterior a '.png' (por ejemplo) al agregar imรกgenes",
            "Los comandos principales ahora pueden escribirse en mayรบsculas tambiรฉn",
            "`wait` muestra los minutos restantes para obtener mรกs acciones"
        ],

        cmd: [
            "**__Ayuda sobre comandos personalizados:__**",
            "`+ <cmd>` agrega un comando personalizado",
            "`- <cmd>` elimina un comando personalizado",
            "`list` muestra todos los comandos personalizados",
            "",
            "`<cmd> list` muestra todos las opciones del comando",
            "`<cmd> <nรบmero>` muestra una opciรณn especรญfica del comando",
            "`<cmd>` muestra una opciรณn al azar del comando",
            "`<cmd> + <opciรณn>` agrega una opciรณn al comando",
            "`<cmd> + <cantidad> gifs (<tรฉrmino de bรบsqueda>)` agrega gifs segรบn el tรฉrmino de bรบsqueda (default = `<cmd>`)",
            "`<cmd> + <cantidad> imgs (<tรฉrmino de bรบsqueda>)` agrega imรกgenes segรบn el tรฉrmino de bรบsqueda (default = `<cmd>`)",
            "`<cmd> - <nรบmero de opciรณn>` remueve una opciรณn especรญfica del comando",
            "`<cmd> - all` remueve todas las opciones del comando",
            "`<cmd> - last` remueve la รบltima opciรณn que se mostrรณ del comando",
            "`<cmd> -` remueve la รบltima opciรณn del comando",
        ],

        game: [
            "**__Ayuda sobre juegos:__**",
            "`game <juego>` inicia una partida del juego seleccionado",
            "`game list` muestra todos los juegos disponibles",
        ],

        bot: [
            "**__Ayuda sobre el bot:__**",
            "`save` guarda todos los datos permanentemente",
            "`reset` resetea la conexiรณn entre el bot y Discord",
            "`prefix <prefijo>` establece un nuevo prefijo para comandos",
            "`exit (nosave)` apaga el bot y guarda los datos a menos que se escriba 'nosave'",
            "`config` muestra la configuraciรณn actual",
        ],

    },

}

Texts.help.c = Texts.help.card
Texts.help.u = Texts.help.user

module.exports = Texts;