global.moveToTarget = function (creep, target, canUseSwamp = true) {
    
    // if(creep.fatigue != 0) return -1
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
        ret = creep.moveTo(target, {
            visualizePathStyle: { stroke: "#ffffff" },
            maxOps: 100000,
            maxRooms: 16,
        });
        // console.log(target)
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

global.moveToRoomIgnoreStructures = function (creep, targetRoom) {
    
    if (creep.memory.pathfinderPath == undefined || creep.memory.pathfinderPath.length == 0) {
        let from = creep.pos;
        let to = { pos: new RoomPosition(25, 25, targetRoom), range: 1} ;
        
        // Use `findRoute` to calculate a high-level plan for this path,
        // prioritizing highways and owned rooms
        let allowedRooms = { [from.roomName]: true };
        log.log(from.toString())
        log.log(to.pos.toString())
        Game.map.findRoute(from.roomName, to.pos.roomName, {
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
            
        _.forEach(allowedRooms, (a, i) => {
            console.log(i)
        })
        
        console.log("finding path between these rooms")
        
        // Invoke PathFinder, allowing access only to rooms from `findRoute`
        creep.memory.pathfinderPath = PathFinder.search(from, to, {
            roomCallback(roomName) {
                console.log(roomName)
                if (allowedRooms[roomName] === undefined) {
                    return false;
                }
                else {
                    console.log(roomName)
                }
            },
        });
        console.log(creep.memory.pathfinderPath.path);
    }
    
    

    if (creep.memory.pathfinderPath != undefined && creep.memory.pathfinderPath.path.length)
    {
        if(creep.fatigue == 0) {
            if(creep.memory.pathfinderPath.path[0].roomName != creep.room.name) {
                // console.log(creep.room.name)
                // console.log(creep.memory.pathfinderPath.path[0].roomName)
                const route = Game.map.findRoute(creep.room, creep.memory.pathfinderPath.path[0].roomName);
                if (route.length > 0) {
                    // console.log(exit)
                    creep.move(route[0].exit, {
                        visualizePathStyle: { stroke: "#ffffff" },
                    });
                    return
                } else {
                    console.log("erroe")
                }
            }
            if ((ret = creep.moveTo(creep.memory.pathfinderPath.path[0].x, creep.memory.pathfinderPath.path[0].y)) == OK) {
                creep.room.visual.circle(creep.memory.pathfinderPath.path[0].x, creep.memory.pathfinderPath.path[0].y)
                creep.memory.pathfinderPath.path.shift()
                if((creep.memory.prevPos != undefined && creep.memory.prevPos == creep.pos) || !creep.pos.isNearTo(creep.memory.pathfinderPath.path[0].x, creep.memory.pathfinderPath.path[0].y)) {
                    //red flag, reset
                    creep.memory.pathfinderPath = undefined
                }
                creep.memory.prevPos = {}
                creep.memory.prevPos.pos = creep.pos
                creep.memory.prevPos.tick = Game.time
            } else {
                log.log(ret)
                // log.log(creep.memory.pathfinderPath.path[0].toString())
                // log.log(creep.memory.pathfinderPath.path[0].x)
                // log.log(creep.memory.pathfinderPath.path[0].y)
                // console.log("scrubbing path from "+ creep)
                // creep.memory.pathfinderPath = undefined
            }
        }
    }
};

global.moveToRoom = function (creep, targetRoom) {
    
    console.log("moveToRoom")
    
    if (creep.memory.pathfinderPath == undefined || creep.memory.pathfinderPath.length == 0) {
        let from = creep.pos;
        let to = { pos: new RoomPosition(25, 25, targetRoom), range: 1} ;
        
        // Use `findRoute` to calculate a high-level plan for this path,
        // prioritizing highways and owned rooms
        let allowedRooms = { [from.roomName]: true };
        log.log(from.toString())
        log.log(to.pos.toString())
        Game.map.findRoute(from.roomName, to.pos.roomName, {
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
            
        _.forEach(allowedRooms, (a, i) => {
            // console.log(i)
        })
        
        console.log("finding path between these rooms")
        
        // Invoke PathFinder, allowing access only to rooms from `findRoute`
        creep.memory.pathfinderPath = PathFinder.search(from, to, {
            // We need to set the defaults costs higher so that we
            // can set the road cost lower in `roomCallback`
            plainCost: 2,
            swampCost: 10,
            // maxOps: 15000,
            
            roomCallback: function (roomName) {
                let room = Game.rooms[roomName];
                // In this example `room` will always exist, but since
                // PathFinder supports searches which span multiple rooms
                // you should be careful!
                // console.log(roomName)
                if (!room) return;
                if (allowedRooms[roomName] === undefined) {
                    return false;
                }
                let costs = new PathFinder.CostMatrix();
    
                room.find(FIND_STRUCTURES).forEach(function (struct) {
                    if (struct.structureType === STRUCTURE_ROAD) {
                        // Favor roads over plain tiles
                        costs.set(struct.pos.x, struct.pos.y, 1);
                    } else if (struct.structureType !== STRUCTURE_CONTAINER && (struct.structureType !== STRUCTURE_RAMPART || !struct.my)) {
                        // Can't walk through non-walkable buildings
                        costs.set(struct.pos.x, struct.pos.y, 0xff);
                    }
                });
    
                // Avoid creeps in the room
                room.find(FIND_CREEPS).forEach(function (creep) {
                    costs.set(creep.pos.x, creep.pos.y, 0xff);
                });
    
                return costs;
            },
        });
        console.log(creep.memory.pathfinderPath.path);
    }
    
    

    if (creep.memory.pathfinderPath != undefined && creep.memory.pathfinderPath.path.length)
    {
        if(creep.fatigue == 0) {
            if(creep.memory.pathfinderPath.path[0].roomName != creep.room.name) {
                // console.log(creep.room.name)
                // console.log(creep.memory.pathfinderPath.path[0].roomName)
                const route = Game.map.findRoute(creep.room, creep.memory.pathfinderPath.path[0].roomName);
                if (route.length > 0) {
                    // console.log(exit)
                    creep.move(route[0].exit, {
                        visualizePathStyle: { stroke: "#ffffff" },
                    });
                    return
                } else {
                    console.log("erroe")
                }
            }
            if ((ret = creep.moveTo(creep.memory.pathfinderPath.path[0].x, creep.memory.pathfinderPath.path[0].y)) == OK) {
                creep.room.visual.circle(creep.memory.pathfinderPath.path[0].x, creep.memory.pathfinderPath.path[0].y)
                creep.memory.pathfinderPath.path.shift()
                if(
                    (creep.memory.prevPos != undefined && creep.memory.prevPos == creep.pos) 
                    || 
                    !creep.pos.isNearTo(creep.memory.pathfinderPath.path[0].x, creep.memory.pathfinderPath.path[0].y)
                ) {
                    //red flag, reset
                    creep.memory.pathfinderPath = undefined
                }
                creep.memory.prevPos = {}
                creep.memory.prevPos.pos = creep.pos
                creep.memory.prevPos.tick = Game.time
            } else {
                // log.log(ret)
                // log.log(creep.memory.pathfinderPath.path[0].toString())
                // log.log(creep.memory.pathfinderPath.path[0].x)
                // log.log(creep.memory.pathfinderPath.path[0].y)
                // console.log("scrubbing path from "+ creep)
                // creep.memory.pathfinderPath = undefined
            }
        }
    }
};

global.moveToSoftestWall = function (creep, targetStructurePos) {
    
    if (creep.memory.pathfinderPath == undefined || creep.memory.pathfinderPath.length == 0) {
        let from = creep.pos;
        let to = { pos: new RoomPosition(targetStructurePos.x, targetStructurePos.y, targetStructurePos.roomName), range: 1} ;
        

        // Invoke PathFinder, allowing access only to rooms from `findRoute`
        creep.memory.pathfinderPath = PathFinder.search(from, to, {
            // We need to set the defaults costs higher so that we
            // can set the road cost lower in `roomCallback`
            plainCost: 2,
            swampCost: 10,
            // maxOps: 15000,
            
            roomCallback: function (roomName) {
                let room = Game.rooms[roomName];
                // In this example `room` will always exist, but since
                // PathFinder supports searches which span multiple rooms
                // you should be careful!
                // console.log(roomName)
                if (!room) return;
                let costs = new PathFinder.CostMatrix();
    
                room.find(FIND_STRUCTURES).forEach(function (struct) {
                    if (struct.structureType === STRUCTURE_ROAD) {
                        // Favor roads over plain tiles
                        costs.set(struct.pos.x, struct.pos.y, 1);
                    } else if (struct.structureType !== STRUCTURE_CONTAINER && (struct.structureType !== STRUCTURE_RAMPART || !struct.my)) {
                        // Can't walk through non-walkable buildings
                        costs.set(struct.pos.x, struct.pos.y, struct.hits);
                    }
                });
                
                console.log(JSON.serialize(costs))

                return costs;
            },
        });
        console.log(creep.memory.pathfinderPath.path);
    }
    
    

    if (creep.memory.pathfinderPath != undefined && creep.memory.pathfinderPath.path.length)
    {
        if(creep.fatigue == 0) {
            if(creep.memory.pathfinderPath.path[0].roomName != creep.room.name) {
                // console.log(creep.room.name)
                // console.log(creep.memory.pathfinderPath.path[0].roomName)
                const route = Game.map.findRoute(creep.room, creep.memory.pathfinderPath.path[0].roomName);
                if (route.length > 0) {
                    // console.log(exit)
                    // creep.move(route[0].exit, {
                    //     visualizePathStyle: { stroke: "#ffffff" },
                    // });
                    return
                } else {
                    console.log("erroe")
                }
            }
            if ((ret = creep.moveTo(creep.memory.pathfinderPath.path[0].x, creep.memory.pathfinderPath.path[0].y)) == OK) {
                creep.room.visual.circle(creep.memory.pathfinderPath.path[0].x, creep.memory.pathfinderPath.path[0].y)
                creep.memory.pathfinderPath.path.shift()
                if((creep.memory.prevPos != undefined && creep.memory.prevPos == creep.pos) || !creep.pos.isNearTo(creep.memory.pathfinderPath.path[0].x, creep.memory.pathfinderPath.path[0].y)) {
                    //red flag, reset
                    creep.memory.pathfinderPath = undefined
                }
                creep.memory.prevPos = {}
                creep.memory.prevPos.pos = creep.pos
                creep.memory.prevPos.tick = Game.time
            } else {
                log.log(ret)
                // log.log(creep.memory.pathfinderPath.path[0].toString())
                // log.log(creep.memory.pathfinderPath.path[0].x)
                // log.log(creep.memory.pathfinderPath.path[0].y)
                // console.log("scrubbing path from "+ creep)
                // creep.memory.pathfinderPath = undefined
            }
        }
    }
};

global.usePathfinder = function (creep, goals) {
    // let goals = _.map(creep.room.find(FIND_SOURCES), function (source) {
    //     // We can't actually walk on sources-- set `range` to 1
    //     // so we path next to it.
    //     return { pos: source.pos, range: 1 };
    // });
    

    if (creep.memory.pathfinderPath == undefined || creep.memory.pathfinderPath.length == 0) {
        console.log("finding new path")
        
        
        console.log(creep.room.name)
        console.log(goals.pos.roomName)
        
    
        let allowedRooms = { [creep.room.name]: true };
        Game.map.findRoute(creep.room, goals.pos.roomName, {
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
            
        // _.forEach(allowedRooms, (a, i) => {
        //     console.log(a)
        //     console.log(i)
        //     })
        
        
        creep.memory.pathfinderPath = PathFinder.search(creep.pos, goals, {
            // We need to set the defaults costs higher so that we
            // can set the road cost lower in `roomCallback`
            plainCost: 2,
            swampCost: 10,
            // maxOps: 15000,
            
            roomCallback: function (roomName) {
                let room = Game.rooms[roomName];
                // In this example `room` will always exist, but since
                // PathFinder supports searches which span multiple rooms
                // you should be careful!
                console.log(roomName)
                if (!room) return;
                if (allowedRooms[roomName] === undefined) {
                    return false;
                }
                let costs = new PathFinder.CostMatrix();
    
                room.find(FIND_STRUCTURES).forEach(function (struct) {
                    if (struct.structureType === STRUCTURE_ROAD) {
                        // Favor roads over plain tiles
                        costs.set(struct.pos.x, struct.pos.y, 1);
                    } else if (struct.structureType !== STRUCTURE_CONTAINER && (struct.structureType !== STRUCTURE_RAMPART || !struct.my)) {
                        // Can't walk through non-walkable buildings
                        costs.set(struct.pos.x, struct.pos.y, 0xff);
                    }
                });
    
                // Avoid creeps in the room
                room.find(FIND_CREEPS).forEach(function (creep) {
                    costs.set(creep.pos.x, creep.pos.y, 0xff);
                });
    
                return costs;
            },
        });
    }

    if (creep.memory.pathfinderPath != undefined && creep.memory.pathfinderPath.path.length)
    {
        if(creep.fatigue == 0) {
            if ((ret = creep.moveByPath(creep.memory.pathfinderPath.path)) == OK) {
                // creep.memory.pathfinderPath.path.shift()
            } else {
                // log.log(ret)
                // log.log(creep.memory.pathfinderPath.path[0].toString())
                // log.log(creep.memory.pathfinderPath.path[0].x)
                // log.log(creep.memory.pathfinderPath.path[0].y)
                // console.log("scrubbing path from "+ creep)
                // creep.memory.pathfinderPath = undefined
            }
        }
    }
};
