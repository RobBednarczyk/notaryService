# Blockchain Data

This project aims to present a simple private blockchain that is supported by the levelDB database.
It was created using the express.js framework

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

Installing Node and NPM is pretty straightforward using the installer package available from the (Node.js® web site)[https://nodejs.org/en/].

### Configuring your project

- fetch the current repository contents to your local drive

- Use NPM to initialize your project and create package.json with project dependencies.
```
npm init
```


## Testing

To test the application:

1: Make sure you are in the 'main' directory of the project
2: Start the server by typing
```
node launch.js
```
3: The server is running on "http://localhost:8000"

4: The genesis block is created automatically and added to the blockchain
5: The user is able to add a new block by:

- clicking the 'Add block' button
- typing the new block body in the text box
- clicking the 'Add' button

## API endponts

There are two API endpoints:

- GET: (user is able to retrieve a block by providing its height)

To access the GET endpoint the user should navigate to:
http://localhost:8000/block/0

or type the following command into the command line:

```
curl "http://localhost:8000/block/_blockheight_"
```

where "_blockheight_" should be an integer

- POST: (user is able to add a new block to the chain)

To access the POST endpoint the user shoud either:
- navigate to: http://localhost:8000/newBlock
- click "Add new block" link on the home page
- type the following command into the command line:

```
curl -d '{"blockBody":"user input"}' -H "Content-Type: application/json" -X POST http://localhost:8000/newBlock
```
