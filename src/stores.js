import {
    writable
} from 'svelte/store'

import data from './employees.json'
const fs = require('fs')

export const employees = writable(data)

export function UpdateEmployees(newData) {
    console.log('STARTED UPDATING ')

    fs.writeFile('./src/employees.json', JSON.stringify(newData, null, 2), (err) => {
        if (err) console.error('🟥 ERR', err)
    })
}

export const Admin = writable(data)

export function Administrator(newData) {
    console.log('STARTED UPDATING ')

    fs.writeFile('./src/users.json', JSON.stringify(newData, null, 2), (err) => {
        if (err) console.error('🟥 ERR', err)
    })
}


// [{
//     "id": 1,
//     "first_name": "Edvard",
//     "last_name": "Verick",
//     "email": "everick0@bandcamp.com",
//     "rank": "Desktop Support Technician",
//     "work_started": "",
//     "shift_hours": ""
// },

// {
//     "id": 2,
//     "first_name": "Ethel",
//     "last_name": "Blowes",
//     "email": "eblowes1@i2i.jp",
//     "rank": "Recruiter",
//     "work_started": "",
//     "shift_hours": ""
// },
// {
//     "id": 3,
//     "first_name": "Rubina",
//     "last_name": "Herley",
//     "email": "rherley2@epa.gov",
//     "rank": "Editor",
//     "work_started": "",
//     "shift_hours": ""
// },
// {
//     "id": 4,
//     "first_name": "Nial",
//     "last_name": "Pareman",
//     "email": "npareman3@hugedomains.com",
//     "rank": "Registered Nurse",
//     "work_started": "",
//     "shift_hours": ""
// },
// {
//     "id": 5,
//     "first_name": "Cindelyn",
//     "last_name": "Mizen",
//     "email": "cmizen4@cisco.com",
//     "rank": "VP Accounting",
//     "work_started": "",
//     "shift_hours": ""
// },
// {
//     "id": 6,
//     "first_name": "Sibbie",
//     "last_name": "Dunkerton",
//     "email": "sdunkerton5@rediff.com",
//     "rank": "Budget/Accounting Analyst II",
//     "work_started": "",
//     "shift_hours": ""
// },
// {
//     "id": 7,
//     "first_name": "Ebba",
//     "last_name": "Gianotti",
//     "email": "egianotti6@amazon.de",
//     "rank": "Account Executive",
//     "work_started": "",
//     "shift_hours": ""
// }
// ]