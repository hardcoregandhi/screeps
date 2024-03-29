var roleTower = {
    /** @param {Creep} creep **/
    run: function (tower) {
        percentageBased = true;

        var highlyDamagedStructFound = tower.room.find(FIND_STRUCTURES, {
            filter: (structure) =>
                (structure.structureType == STRUCTURE_ROAD && Math.round((structure.hits / structure.hitsMax) * 100 < 5)) || (structure.structureType == STRUCTURE_WALL && Math.round((structure.hits / structure.hitsMax) * 100 < 0.001)),
        });

        var wallHealPercent = 0.0;
        if (tower.room.controller.level == 8) {
            wallHealPercent = 0.1;
        }

        var customStructureSpecificPercentLimits = tower.room.find(FIND_STRUCTURES).filter((structure) => {
            return (
                (structure.structureType == STRUCTURE_ROAD && Math.round((structure.hits / structure.hitsMax) * 100 < 50)) ||
                (structure.structureType == STRUCTURE_CONTAINER && Math.round((structure.hits / structure.hitsMax) * 100 < 50)) ||
                (structure.structureType == STRUCTURE_RAMPART && Math.round((structure.hits / structure.hitsMax) * 100 < 0.1)) ||
                (structure.structureType == STRUCTURE_WALL && Math.round((structure.hits / structure.hitsMax) * 100 < wallHealPercent))
            );
        });

        var closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        var allHostiles = tower.room.find(FIND_HOSTILE_CREEPS);
        var healer = null;
        for (var h of allHostiles) {
            console.log(h);
            if (h.body.includes(HEAL)) {
                healer = h;
            }
        }

        if (healer) {
            tower.attack(healer);
        }

        if (closestHostile) {
            tower.attack(closestHostile);
            return;
        }
        var closestCreep = tower.pos.findClosestByRange(FIND_MY_CREEPS, {
            filter: (creep) => Math.round((creep.hits / creep.hitsMax) * 100 < 99),
        });
        if (closestCreep) {
            tower.heal(closestCreep);
            return;
        }

        // let the tower heal but don't reapir if the energy is short
        if (creepRoomMap.get(tower.room.name + "eenergy") + tower.room.energyAvailable < 500) {
            return;
        }

        if (highlyDamagedStructFound.length) {
            highlyDamagedStructFound.sort((a, b) => a.hits - b.hits);
            mostDamagedStructure = highlyDamagedStructFound[0];

            for (var t of highlyDamagedStructFound) {
                new RoomVisual().text(t.hits, t.pos, {
                    align: "right",
                    font: 0.2,
                });
            }
            // damagedStructures.forEach((e, i) => (new RoomVisual().text(e.hits + " Order: " + i, e.pos, {align: 'left'})));

            if (mostDamagedStructure) {
                tower.room.visual.circle(mostDamagedStructure.pos, {
                    stroke: "green",
                    radius: 0.5,
                    lineStyle: "dashed",
                    fill: "transparent",
                });
                tower.repair(mostDamagedStructure);
            }
        } else {
            //customStructureSpecificPercent
            customStructureSpecificPercentLimits.sort((a, b) => a.hits - b.hits);
            closestTarget = tower.pos.findClosestByRange(customStructureSpecificPercentLimits);

            for (var t of customStructureSpecificPercentLimits) {
                new RoomVisual().text(t.hits, t.pos, {
                    align: "right",
                    font: 0.2,
                });
            }
            // damagedStructures.forEach((e, i) => (new RoomVisual().text(e.hits + " Order: " + i, e.pos, {align: 'left'})));

            if (closestTarget) {
                if (Game.flags.DISMANTLE != undefined && Game.flags.DISMANTLE.pos.isEqualTo(closestTarget)) {
                    return;
                }
                tower.room.visual.circle(closestTarget.pos, {
                    stroke: "green",
                    radius: 0.5,
                    lineStyle: "dashed",
                    fill: "transparent",
                });
                tower.repair(closestTarget);
                return;
            }
        }
    },
};

module.exports = roleTower;
