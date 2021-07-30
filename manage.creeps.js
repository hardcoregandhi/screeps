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


global.runCreeps = function() {
    for (var name in Game.creeps) {
        var creep = Game.creeps[name];
        try {
            if (creep.pos.x == 49) creep.move(7);
            if (creep.pos.y == 49) creep.move(1);
            if (creep.pos.x == 0) creep.move(3);
            if (creep.pos.y == 0) creep.move(5);
    
            if (creep.memory.role == "traveller") {
                roleTraveller.run(creep);
                continue;
            }
            // var closestHostile = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
            // if (closestHostile) {
            //     roleDefence.run(creep)
            //     continue
            // }
            if (creep.memory.role == "upgrader" && harvesters.length < 1) {
                roleHarvester.run(creep);
                continue;
            }
            if (creep.memory.role == "harvester") {
                roleHarvester.run(creep, focusHealing);
            }
            if (creep.memory.role == "upgrader") {
                roleUpgrader.run(creep);
            }
            if (creep.memory.role == "builder") {
                roleBuilder.run(creep);
            }
            if (creep.memory.role == "claimer") {
                roleClaimer.run(creep);
            }
            if (creep.memory.role == "harvesterExt") {
                roleHarvesterExt.run(creep);
            }
            if (creep.memory.role == "moverExt") {
                roleMoverExt.run(creep);
            }
            if (creep.memory.role == "trucker") {
                roleTrucker.run(creep);
            }
            if (creep.memory.role == "soldier") {
                roleSoldier.run(creep);
            }
            if (creep.memory.role == "powHarvester") {
                rolePowHarvester.run(creep);
            }
            if (creep.memory.role == "powMover") {
                rolePowMover.run(creep);
            }
            if (creep.memory.role == "mover") {
                var droppedResource = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
                    filter: (r) => r.amount >= 150,
                });
                var tombstoneResource = creep.pos.findClosestByRange(FIND_TOMBSTONES, {
                    filter: (r) => r.store.getUsedCapacity() >= 150,
                });
                if (droppedResource || tombstoneResource) {
                    if (droppedResource)
                        creep.room.visual.circle(droppedResource.pos, {
                            color: "red",
                            radius: 0.5,
                            lineStyle: "dashed",
                        });
                    if (tombstoneResource)
                        creep.room.visual.circle(tombstoneResource.pos, {
                            color: "red",
                            radius: 0.5,
                            lineStyle: "dashed",
                        });
                    // console.log(droppedResource.pos)
                    roleScavenger.run(creep);
                    continue;
                }
                // if (creepRoomMap.get(creep.memory.baseRoomName+"harvester") == 0) {
                //     roleHarvester.run(creep)
                //     continue
                // }
                roleMover.run(creep);
            }
            if (creep.memory.role == "DIE") {
                creep.moveTo(spawn.pos);
                if (spawn.recycleCreep(creep) != 0) {
                    creep.moveTo(spawn.pos);
                }
            }
        } catch (e) {}
    }
}


