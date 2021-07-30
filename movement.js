global.moveToTarget = function (creep, target, canUseSwamp) {
    canUseSwamp = true;
    if (canUseSwamp) {
        creep.moveTo(target, {
            visualizePathStyle: { stroke: "#ffffff" },
            maxRooms: 1,
        });
    } else {
        const path = creep.room.findPath(creep.pos, target, {
            ignoreCreeps: false,
        });
        if (path.length) {
            roomPos = new RoomPosition(path[0].x, path[0].y, creep.room.name);
            isSwamp = new Room.Terrain(creep.room.name).get(path[0].x, path[0].y) == TERRAIN_MASK_SWAMP;
            isPath = roomPos.lookFor(LOOK_STRUCTURES).length != 0;
            for (var pathStep of path) {
                if (!isSwamp || (isSwamp && isPath)) {
                    creep.room.visual.circle(pathStep, { fill: "red" });
                }
            }
            if (!isSwamp || (isSwamp && isPath)) {
                return creep.moveTo(path[0].x, path[0].y, {
                    visualizePathStyle: { stroke: "#ffffff" },
                    maxRooms: 1,
                });
            }
        } else {
            return -1;
        }
    }
};

global.moveToRoom = function (creep, targetRoom) {
    let from = creep.pos;
    let to = targetRoom;

    // Use `findRoute` to calculate a high-level plan for this path,
    // prioritizing highways and owned rooms
    let allowedRooms = { [from.roomName]: true };
    Game.map
        .findRoute(from.roomName, to.roomName, {
            routeCallback(roomName) {
                let parsed = /^[WE]([0-9]+)[NS]([0-9]+)$/.exec(roomName);
                let isHighway = parsed[1] % 10 === 0 || parsed[2] % 10 === 0;
                let isMyRoom = Game.rooms[roomName] && Game.rooms[roomName].controller && Game.rooms[roomName].controller.my;
                if (isHighway || isMyRoom) {
                    return 1;
                } else {
                    return 2.5;
                }
            },
        })
        .forEach(function (info) {
            allowedRooms[info.room] = true;
        });

    // Invoke PathFinder, allowing access only to rooms from `findRoute`
    let ret = PathFinder.search(from, to, {
        roomCallback(roomName) {
            if (allowedRooms[roomName] === undefined) {
                return false;
            }
        },
    });

    console.log(ret.path);
};
