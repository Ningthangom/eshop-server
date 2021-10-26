const expressJwt = require('express-jwt');

function authJwt() {
    const jwt_secret = process.env.jwt_secret;
    const api = process.env.API_URL;
    return expressJwt({
        secret:jwt_secret,
        algorithms: ['HS256'],
        isRevoked: isRevoked
    }).unless({
        path:[
            //${api}/products
            //regular expressions
            // /\/api\/v1\/products(.*)/
            { url:/\/public\/upload(.*)/, methods: ['GET', 'OPTIONS'] },
            { url:/\/api\/v1\/products(.*)/, methods: ['GET', 'OPTIONS'] },
            { url:/\/api\/v1\/categories(.*)/, methods: ['GET', 'OPTIONS'] },
            `${api}/users/login`, 
            `${api}/users/register`,  
            
        ]
    })
}

async function isRevoked(req, payload, done) {
    if(!payload.isAdmin){
        done(null,true)
    }

    done();
}

module.exports = authJwt;