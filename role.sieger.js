

global.roleSieger = {
    name: "sieger",
    roleMemory: { memory: { return: false } },
    // prettier-ignore
    baseBodyParts: [TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,],
    bodyLoop: [TOUGH, WORK, MOVE],

    /** @param {Creep} creep **/
    run: function (creep) {
        // creep.say('🏳️');
        if (creep.memory.targetRoomName == undefined) creep.memory.targetRoomName = null;

        // creep.memory.return = true;

        var enemyTowers = [];
        if (creep.pos.roomName == creep.memory.targetRoomName) {
            enemyTowers = creep.room.find(FIND_HOSTILE_STRUCTURES).filter((s) => {
                return s.structureType == STRUCTURE_TOWER;
            });
        }

        if (creep.hits < creep.hitsMax) {
            creep.heal(creep);
        }

        if ((creep.ticksToLive < 300 || creep.memory.healing) && (creep.memory.noHeal == undefined || creep.memory.noHeal != true)) {
            creep.say("healing");
            creep.memory.healing = true;
            delete creep.memory.pathfinderPath
            if (returnToHeal(creep, creep.memory.baseRoomName)) return;
        }

        if (creep.hits < creep.hitsMax / 2) {
            // flee to safety
            creep.say("healing");
            creep.moveTo(Game.rooms[creep.memory.baseRoomName].controller);
            return;
        }
        if (creep.memory.return) {
            creep.moveTo(Game.flags.holding.pos);
            return;
        }

        // if (creep.hits < creep.hitsMax) {
        //     creep.moveTo(Game.rooms[creep.memory.baseRoomName].controller);
        // }

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
            Log(creep, "travelling");
            if (Game.rooms[creep.memory.targetRoomName] == undefined) {
                moveToRoom(creep, creep.memory.targetRoomName);
                return;
            }
        }
        Log(creep, 0);

        // moveToSoftestWall(creep, enemyTowers.length ? enemyTowers[0].pos : creep.room.controller.pos)
        if (Game.flags.WEAK) {
            Log(creep, "WEAK");

            wall = Game.flags.WEAK.pos.lookFor(LOOK_STRUCTURES);
            if (wall.length) {
                Log(creep, "wall found");
                Log(creep, wall[0]);

                if (creep.dismantle(wall[0])) {
                // if (creep.attack(wall[0])) {
                    Log(creep, creep.attack(wall[0]));

                    Log(creep, moveToTarget(creep, wall[0]));
                    return;
                }
            } else {
                Game.flags.WEAK.remove();
            }
            return;
        }
        if (enemyTowers.length) {
            Log(creep, "TOWERS");

            if (creep.dismantle(enemyTowers[0])) {
                creep.move(enemyTowers[0]);
            }
            return;
        }

        hostileSpawns = creep.room.find(FIND_HOSTILE_STRUCTURES).filter((s) => {
            return s.structureType == STRUCTURE_SPAWN;
        });
        if (hostileSpawns.length) {
            hostileSpawn.sort((a, b) => a.hits - b.hits);
            if (creep.dismantle(hostileSpawn[0])) {
                creep.move(hostileSpawn[0]);
            }
            return;
        }

        allHostileStructures = creep.room.find(FIND_HOSTILE_STRUCTURES).filter((s) => {
            return s.structureType != STRUCTURE_CONTROLLER && s.structureType != STRUCTURE_ROAD;
        });
        if (allHostileStructures.length) {
            closest = creep.pos.findClosestByPath(allHostileStructures);
            if (creep.dismantle(closest)) {
                creep.move(closest);
            }
            return;
        }

        creep.memory.role = "DIE";
    },
};

module.exports = roleSieger;
