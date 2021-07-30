var roleHarvester = require("role.harvester");
var roleHarvesterExt = require("role.harvesterExt");
var roleUpgrader = require("role.upgrader");
var roleBuilder = require("role.builder");
var roleTower = require("tower");
var roleClaimer = require("role.claimer");
var roleMover = require("role.mover");
var roleMoverExt = require("role.moverExt");
var roleDefence = require("role.defense");
var roleScavenger = require("role.scavenger");
var roleTraveller = require("role.traveller");
var roleTrucker = require("role.trucker");
var roleSoldier = require("role.soldier");
var rolePowHarvester = require("role.powHarvester");
var rolePowMover = require("role.powMover");

global.runSpawns = function() {
    global.nextSpawnOffset = 1;

    for (var room in Game.rooms) {
        r = Game.rooms[room];
        if (!myRooms.includes(r.name)) {
            continue;
        }
        if (Memory.createClaimer) {
            if (spawnCreep(roleClaimer, null, { memory: { baseRoomName: r.name } }, r.name) == 0) {
                Memory.createClaimer = false;
            }
        } else if (creepRoomMap.get(r.name + "harvester") < 1) {
            BaseBodyParts = [WORK, CARRY, CARRY, MOVE, MOVE];
            spawnCreep(roleHarvester, BaseBodyParts, null, r.name);
            continue;
        } else if (creepRoomMap.get(r.name + "mover") < 1) {
            BaseBodyParts = [CARRY, CARRY, CARRY, MOVE, MOVE];
            spawnCreep(roleMover, BaseBodyParts, null, r.name);
            continue;
        } else if (creepRoomMap.get(r.name + "harvester") < 3) {
            spawnCreep(roleHarvester, null, { memory: { baseRoomName: r.name } }, r.name);
            continue;
        } else if (creepRoomMap.get(r.name + "upgrader") < 1) {
            spawnCreep(roleUpgrader, null, { memory: { baseRoomName: r.name } }, r.name);
            continue;
        } else if (creepRoomMap.get(r.name + "builder") < creepRoomMap.get(r.name + "csites") / 2 && creepRoomMap.get(r.name + "builder") < 3) {
            spawnCreep(roleBuilder, null, { memory: { baseRoomName: r.name } }, r.name);
            continue;
        } else if (creepRoomMap.get(r.name + "mover") < 2) {
            spawnCreep(roleMover, null, { memory: { baseRoomName: r.name } }, r.name);
            continue;
        } else if (creepRoomMap.get(r.name + "upgrader") < 5 && creepRoomMap.get(r.name + "csites") < 1) {
            spawnCreep(roleUpgrader, null, { memory: { baseRoomName: r.name } }, r.name);
            continue;
        }
        // if (creepRoomMap.get(r.name+"upgrader") > 2) {
        //     // _.forEach(Game.creeps, c => { if(c.memory.role == 'harvester' && c.body.length == 5){ console.log(c.body.length)} } )
        //     c = _.find(Game.creeps, function(c) { if(c.memory.role == 'harvester' && c.body.length == 5){ return c } } )
        //     if(c) {
        //         c.memory.role = 'DIE'
        //     }
        // }

        // else if (r.name == "W16S21" && creepRoomMap.get(r.name+"harvesterExt") < 1) {
        //     spawnCreep(roleHarvesterExt, null, { memory: {baseRoomName: r.name }}, r.name);
        //     continue
        // }
        // else if (r.name == "W16S21" && creepRoomMap.get(r.name+"moverExt") < 2) {
        //     spawnCreep(roleMoverExt, null, { memory: {baseRoomName: r.name }}, r.name);
        //     continue
        // }
        nextSpawnOffset += 1;
    }
    // if (!Game.rooms["W17S21"].controller.my) {
    // spawnCreep(roleClaimer);
    // }

    // if (spawn.spawning == true) {
    //     var spawningCreep = Game.creeps[spawn.spawning.name];
    //     spawn.room.visual.text("🛠️" + spawningCreep.name, spawn.pos.x + 1, spawn.pos.y, {
    //         align: "left",
    //         opacity: 0.8,
    //     });
    // }
}
