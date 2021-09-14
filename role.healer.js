global.roleHealer = {
    name: "healer",
    roleMemory: { memory: {"return": false, targetRoomName: null } },
    // prettier-ignore
    BodyParts: [
        MOVE,MOVE,
        HEAL,HEAL,
    ],
    baseBodyParts: [MOVE,MOVE,MOVE,],
    subBodyParts: [HEAL,HEAL,],
    bodyLoop: [MOVE, HEAL,],

    /** @param {Creep} creep **/
    run: function (creep) {
        // creep.say('🏳️');
        if (creep.memory.targetRoomName == undefined) creep.memory.targetRoomName = "W9S3";

        // creep.memory.return = true;

        if (creep.hits < creep.hitsMax) {
            creep.heal(creep)
        }
        
        if (creep.ticksToLive < 300 || creep.memory.healing) {
            creep.say("healing");
            creep.memory.healing = true;
            if (returnToHeal(creep, creep.memory.baseRoomName)) return
        }
        
        if (creep.memory.return) {
            creep.moveTo(Game.flags.holding.pos);
            return;
        }
        
        var allHurtCreeps = creep.room.find(FIND_MY_CREEPS, {
            filter: (c) => {
                return c.hits < c.hitsMax;
            },
        });
        var closestHurtCreep = creep.pos.findClosestByRange(allHurtCreeps);

        if(creep.memory.passiveTravel == undefined || creep.memory.passiveTravel == false) {
            // var allHostileCreeps = creep.room.find(FIND_HOSTILE_CREEPS)
            // var hostileCreeps = creep.room.find(FIND_HOSTILE_CREEPS, {filter: (c) => {return c.body.find((part) => part.type == ATTACK) || c.body.find((part) => part.type == RANGED_ATTACK)}})
            // if (hostileCreeps.length > 2 || allHostileCreeps.length > 4) {
            //     cloneCreep(creep.name)
            // }
            
            var closestHostile = 
                creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
                
            if(creep.isNearTo(closestHostile)) {
                creep.moveTo(
                    (creep.pos.x - closestHostile.pos.x) * -1,
                    (creep.pos.y - closestHostile.pos.y) * -1
                );
            }
                
            // console.log(closestHostile)
            if (closestHurtCreep) {
                creep.room.visual.circle(closestHostile.pos, {
                    color: "red",
                    radius: 1,
                });
                if(creep.fatigue > 0) {
                    creep.rangedHeal(closestHurtCreep)
                } else {
                    if (creep.heal(closestHurtCreep) != OK) {
                        creep.moveTo(closestHostile, { maxRooms: 1 });
                    }
                }
                return;
            }
            
            var closestFriendlySoldier = 
                creep.pos.findClosestByRange(FIND_MY_CREEPS, {filter: (c) => {return c.body.find((part) => part.type == ATTACK) || c.body.find((part) => part.type == RANGED_ATTACK)}});
            
            if(closestFriendlySoldier) {
                creep.moveTo(closestFriendlySoldier)
                return
            }
        }

        // if (creep.ticksToLive < 500) {
        //     if (creep.room.name != creep.memory.baseRoomName) {
        //         const route = Game.map.findRoute(creep.room, creep.memory.baseRoomName);
        //         if (route.length > 0) {
        //             const exit = creep.pos.findClosestByRange(route[0].exit);
        //             creep.moveTo(exit);
        //             return
        //         }
        //     }
        // }

        if (creep.room.name != creep.memory.targetRoomName) {
            // if(Game.rooms[creep.memory.targetRoomName] == undefined) {
            //     usePathfinder(creep, { pos: new RoomPosition(25,25,creep.memory.targetRoomName), range: 1 })
            // }
            // else {
                const route = Game.map.findRoute(creep.room, creep.memory.targetRoomName, {
                    maxRooms: 1,
                });
                if (route.length > 0) {
                    const exit = creep.pos.findClosestByRange(route[0].exit);
                    creep.moveTo(exit);
                    return
                }
            // }
        } else {
            // if (creep.room.controller.safeMode != undefined && enemyTowers.length == 0) {
            //     source = creep.pos.findClosestByPath(FIND_SOURCES);
            //     if (source) creep.moveTo(source);
            //     return;
            // }
            if (creep.attack(creep.room.controller) != OK) {
                creep.heal(creep)
                creep.moveTo(creep.room.controller, { maxRooms: 1 });
            }
        }
    },
};

module.exports = roleHealer;
