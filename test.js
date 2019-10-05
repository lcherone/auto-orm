process.env.DEBUG = '*:*'

const database = new (require('./src/index.js'))({
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOSTNAME,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    freeze: false,
    underscore: true
});

database.connect().then(async () => {

    // await database.query(`
    //     DROP TABLE IF EXISTS person;
    //     DROP TABLE IF EXISTS person_email;
    // `)

    let person = new database.row('person', {
        name: 'Foobar',
        age: 69,
        created: new Date(),
        balance: 1.9999,
        geo: {
            lat: 0.000000,
            lat: 0.000000
        }
    })
    await person.store()

    let emails = await database.storeRows('person_email', [
        { email: 'a@example.com' },
        { email: 'b@example.com' }
    ])

    // link emails to person
    emails = await person.addChildren('person_email', emails)
    console.log(emails)

    database.close()
}).catch(e => {
    console.log(e.message)
    database.close()
})