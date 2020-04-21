const express = require('express')
const { ApolloServer } = require('apollo-server-express')
const { MongoClient } = require('mongodb')
const { readFileSync } = require('fs')
const expressPlayground = require('graphql-playground-middleware-express').default
const resolvers = require('./resolvers')

require('dotenv').config()
let typeDefs = readFileSync( './typeDefs.graphql', 'UTF-8' );


let users = [
    { "githubLogin": "mHattrup", "name": "Mike Hattrup" },
    { "githubLogin": "gPlake", "name": "Glen Plake" },
    { "githubLogin": "sSchmidt", "name": "Scot Schmidt" }
  ]
let photos = [
  {
    "id": "1",
    "name": "Dropping the Heart Chute",
    "description": "The heart chute is one of my favorite chutes",
    "category": "ACTION",    "githubUser": "gPlake"  },
  {
    "id": "2",
    "name": "Enjoying the sunshine",
    "category": "SELFIE",
    "githubUser": "sSchmidt"  },
  {
    id: "3",
    "name": "Gunbarrel 25",
    "description": "25 laps on gunbarrel today",
    "category": "LANDSCAPE",
    "githubUser": "sSchmidt"  } ]

async function start() {
  const app = express()
  const MONGO_DB = process.env.DB_HOST
  let db

  try {
    const client = await MongoClient.connect(MONGO_DB, { useNewUrlParser: true })
    db = client.db()
  } catch (error) {
    console.log(`
    
      Mongo DB Host not found!
      please add DB_HOST environment variable to .env file

      exiting...
       
    `)
    process.exit(1)
  }

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: async ({ req }) => {
      const githubToken = req.headers.authorization
      const currentUser = await db.collection('users').findOne({ githubToken })
      return { db, currentUser }
    }
  })

  server.applyMiddleware({ app })

  app.get('/playground', expressPlayground({ endpoint: '/graphql' }))

  app.get('/', (req, res) => {
    let url = `https://github.com/login/oauth/authorize?client_id=${process.env.CLIENT_ID}&scope=user`
    res.end(`<a href="${url}">Sign In with Github</a>`)
  })

  app.listen({ port: 4000 }, () =>
    console.log(`GraphQL Server running at http://localhost:4000${server.graphqlPath}`)
  )
}

start()
