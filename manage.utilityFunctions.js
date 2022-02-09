removeAllSites = function (roomName) {
    const sites = Game.rooms[roomName].find(FIND_CONSTRUCTION_SITES);
    for (const site of sites) {
        if (site.progress == 0) site.remove();
    }
};

findSoftestWall = function (roomName, creep = null) {
    costs = new PathFinder.CostMatrix();

    terrain = new Room.Terrain(roomName);

    room = Game.rooms[roomName];

    structs = room.find(FIND_STRUCTURES, {
        filter: (structure) => {
            return structure.structureType == STRUCTURE_WALL;
        },
    });

    structs.sort((a, b) => {
        if (a.hits == b.hits && creep) {
            return a.hits + creep.getRangeTo(a) - (b.hits + creep.getRangeTo(b));
        } else {
            return a.hits - b.hits;
        }
    });
    _.forEach(structs, (s) => {
        if (room.find(FIND_EXIT)[0].findPathTo(s).length > 0) {
            console.log(`target is ${s}`);
            return false;
        }
    });
};

findStructureType = function (room, type) {
    return room.find(FIND_STRUCTURES).filter((s) => s.structureType == type);
};

isHighwayRoom = function(roomName) {
    let parsed = /^[WE]([0-9]+)[NS]([0-9]+)$/.exec(roomName);
    return (parsed[1] % 10 === 0) || (parsed[2] % 10 === 0);
}

RemoveFromList = function(list, entry) {
    const index = list.indexOf(entry);
    if (index > -1) {
        list.splice(index, 1); // 2nd parameter means remove one item only
    }
}

AddToList = function(list, entry) {
    if (list == undefined) {
        console.log("can't add to undefined list")
        return
    }
    const index = list.indexOf(entry);
    if (index == -1) {
        list.push(entry); // 2nd parameter means remove one item only
    }
}

