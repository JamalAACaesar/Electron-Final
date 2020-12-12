import Main from './routes/Main.svelte'
import Update from './routes/Update.svelte'
import Create from './routes/Create.svelte'

import Login from './routes/Login.svelte'
import Register from './routes/Register.svelte'

export default {
    '/': Main,

    '/login': Login,
    '/register': Register,
    
    '/create': Create,
    '/update/:id': Update
}