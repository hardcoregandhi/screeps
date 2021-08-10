global.moveToTarget = function (creep, target, canUseSwamp = true) {
    canUseSwamp = true;
    if (canUseSwamp) {
        creep.moveTo(target, {
            visualizePathStyle: { stroke: "#ffffff" },
            maxRooms: 0,
            maxOps: 100000,
        });
    } else {
        const path = creep.room.findPath(creep.pos, target, {
            ignoreCreeps: false,
            maxRooms: 0,
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

global.moveToMultiRoomTarget = function (creep, target, canUseSwamp = true) {
    canUseSwamp = true;
    if (canUseSwamp) {
        creep.moveTo(target, {
            visualizePathStyle: { stroke: "#ffffff" },
            maxOps: 100000,
            maxRooms: 16,
        });
    } else {
        const path = creep.room.findPath(creep.pos, target, {
            ignoreCreeps: false,
            maxRooms: 16,
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
    let from = creep.room.name;
    let to = targetRoom;

    // Use `findRoute` to calculate a high-level plan for this path,
    // prioritizing highways and owned rooms
    let allowedRooms = { [from]: true };
    Game.map
        .findRoute(from, to, {
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
    let pos = ret.path[0];
    creep.move(creep.pos.getDirectionTo(pos));
};

global.usePathfinder = function (creep, goal) {
  let goals = _.map(creep.room.find(FIND_SOURCES), function(source) {
    // We can't actually walk on sources-- set `range` to 1 
    // so we path next to it.
    return { pos: source.pos, range: 1 };
  });

  let ret = PathFinder.search(
    creep.pos, goals,
    {
      // We need to set the defaults costs higher so that we
      // can set the road cost lower in `roomCallback`
      plainCost: 2,
      swampCost: 10,

      roomCallback: function(roomName) {

        let room = Game.rooms[roomName];
        // In this example `room` will always exist, but since 
        // PathFinder supports searches which span multiple rooms 
        // you should be careful!
        if (!room) return;
        let costs = new PathFinder.CostMatrix;

        room.find(FIND_STRUCTURES).forEach(function(struct) {
          if (struct.structureType === STRUCTURE_ROAD) {
            // Favor roads over plain tiles
            costs.set(struct.pos.x, struct.pos.y, 1);
          } else if (struct.structureType !== STRUCTURE_CONTAINER &&
                     (struct.structureType !== STRUCTURE_RAMPART ||
                      !struct.my)) {
            // Can't walk through non-walkable buildings
            costs.set(struct.pos.x, struct.pos.y, 0xff);
          }
        });

        // Avoid creeps in the room
        room.find(FIND_CREEPS).forEach(function(creep) {
          costs.set(creep.pos.x, creep.pos.y, 0xff);
        });

        return costs;
      },
    }
  );

  let pos = ret.path[0];
  creep.move(creep.pos.getDirectionTo(pos));
}
