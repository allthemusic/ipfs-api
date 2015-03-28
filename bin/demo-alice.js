var util = require('util')
var debuglog = util.debuglog('alice');
var url = require('url')
var ipfs = require('../lib/ipfs-api-client')(url.parse('http://localhost:5001/api/v0'))
var DagObject = require('../lib/dag-object')

function randomInt(low, high) {
  return Math.floor(Math.random() * (high - low) + low);
}

function inventMetadataNode() {
  return {
    title: util.format('My song %d', randomInt(0, 100)),
    artist: util.format('Artist %d', randomInt(0, 100)),
  }
}

function inventSomeSongs() {
  var songs = []
  for (i = 0; i <= 10; i++) {
    songs[i] = inventMetadataNode()
    debuglog('songs[%d] =', i, songs[i])
  }
  return songs
}

function addSongMetadataNode(metadata) {
  var obj = new DagObject({
    data: JSON.stringify(metadata)
  })
  debuglog(obj.asJSONforAPI().toString('utf-8'))
  return ipfs.addObject(obj)
}

function addSomeSongs(songs) {
  var addRequests = []
  for (i = 0; i < songs.length; i++) {
    addRequests[i] = addSongMetadataNode(songs[i])
  }
  return Promise.all(addRequests)
}

function addDirectoryTree(contents) {
  debuglog(contents)
  var contentsNode = new DagObject()
  for (i = 0; i < contents.length; i++) {
    contentsNode = contentsNode.addLink('', contents[i].Hash)
    // debuglog('contentsNode = ', contentsNode)
  }
  return ipfs.addObject(contentsNode).then(function (contentsNode) {
    var atmNode = new DagObject().addLink('contents', contentsNode.Hash)
    return ipfs.addObject(atmNode)
  }).then(function (atmNode) {
    var directoryNode = new DagObject().addLink('allthemusic', atmNode.Hash)
    return ipfs.addObject(directoryNode)
  })
}

(function () {
  // TODO: Wear badge
  addSomeSongs(inventSomeSongs()).then(function (objects) {
    debuglog(objects)
    return addDirectoryTree(objects)
  }).then(function (directoryNode) {
    return ipfs.namePublish(directoryNode.Hash)
  }).catch(function (reason) {
    debuglog('FAILED', reason)
    if (reason instanceof Error) {
      console.log(reason.stack)
    }
  })
})()
