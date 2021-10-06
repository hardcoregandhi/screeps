var towerRangeImpactFactor = function (distance) {
    if (distance <= TOWER_OPTIMAL_RANGE) {
        return 1;
    }
    if (distance >= TOWER_FALLOFF_RANGE) {
        return 1 - TOWER_FALLOFF;
    }
    var towerFalloffPerTile = TOWER_FALLOFF / (TOWER_FALLOFF_RANGE - TOWER_OPTIMAL_RANGE);
    return 1 - (distance - TOWER_OPTIMAL_RANGE) * towerFalloffPerTile;
};

global.runTowers = function (room) {
    var towers = []
    for(towerId of Memory.rooms[room.name].towers) {
        // console.log(towerId)
        towers.push(Game.getObjectById(towerId))
    }

    if(!towers.length) return
    

    if (attack(room, towers)) return
    if (heal(room, towers)) return
    if (repair(room, towers)) return
};

attack = function(room, towers) {
    var allHostiles = room.find(FIND_HOSTILE_CREEPS);
    if(!allHostiles.length) return 0
    try {
        var healer = null;
        var healerCount = 0;
        const reducer = (accumulator, currentBodyPart) => {
            // console.log(`currentBodyPart: ${currentBodyPart}`)
            // console.log(`currentBodyPart.type: ${currentBodyPart.type}`)
            // console.log(`currentBodyPart.hits: ${currentBodyPart.hits}`)
            // console.log(`currentBodyPart.boost: ${currentBodyPart.boost}`)
            
            if (currentBodyPart.type == HEAL && currentBodyPart.hits > 0) {
                // console.log("heal part found")
                accumulator += 1;
            }
            if (currentBodyPart.type == HEAL && currentBodyPart.hits > 0 && currentBodyPart.boost != undefined) {
                // console.log("boosted heal part found")
                accumulator += 1;
            }
            // console.log(`accumulator: ${accumulator}`)
            return accumulator;
        };
        for (var h of allHostiles) {
            healparts = h.body.reduce(reducer, 0);
            // console.log(`${h.name} : ${healparts}`)
            if (healerCount < healparts) {
                console.log(`healer found in ${room.name}`)
                healer = h;
                healerCount = healparts;
            }
        }
    
        var potentialAttackDamage = 0
        if (healer) {
            for (var t of towers) {
                potentialAttackDamage += TOWER_POWER_ATTACK * towerRangeImpactFactor(t.pos.getRangeTo(healer));
            }
    
            if (potentialAttackDamage > healerCount * 12) {
                for (var t of towers) {
                    t.attack(healer);
                }
            } else {
                
            }
            return 1
        }
    } catch (e) {
        console.log(`tower failed: ${e}`)
    }
    console.log("no healer found, firing at will")
    for (var t of towers) {
        var closestHostile = t.pos.findClosestByRange(allHostiles);
        if (closestHostile) {
            console.log(t.attack(closestHostile));
        }
    }
    return 1

}

heal = function(room, towers) {
    var hurtCreeps = room.find(FIND_MY_CREEPS).filter((creep) => {
        return Math.round((creep.hits / creep.hitsMax) * 100 < 99)
    });
    for (var tower of towers) {
        if (hurtCreeps.length) {
            tower.heal(hurtCreeps[0]);
            return;
        }
    }
    if (hurtCreeps.length) {
        return 1
    } else {
        return 0
    }
}

repair = function(room, towers) {
    var wallHealPercent = room.controller.level * 0.01;

    var highlyDamagedStructs = room.find(FIND_STRUCTURES)
        .filter((structure) => {
            return (
                (structure.structureType == STRUCTURE_ROAD && Math.round((structure.hits / structure.hitsMax) * 100 < 5)) ||
                (structure.structureType == STRUCTURE_WALL && Math.round((structure.hits / structure.hitsMax) * 100 < wallHealPercent / 10)) &&
                (Game.flags.DISMANTLE == undefined || !Game.flags.DISMANTLE.pos.isEqualTo(structure.pos))
            );
    });

    
    var customStructureSpecificPercentLimits = room.find(FIND_STRUCTURES).filter((structure) => {
        return (
            (structure.structureType == STRUCTURE_ROAD && Math.round((structure.hits / structure.hitsMax) * 100 < 50)) ||
            (structure.structureType == STRUCTURE_CONTAINER && Math.round((structure.hits / structure.hitsMax) * 100 < 50)) ||
            (structure.structureType == STRUCTURE_RAMPART && Math.round((structure.hits / structure.hitsMax) * 100 < wallHealPercent)) ||
            (structure.structureType == STRUCTURE_WALL && Math.round((structure.hits / structure.hitsMax) * 100 < wallHealPercent)) &&
            (Game.flags.DISMANTLE == undefined || !Game.flags.DISMANTLE.pos.isEqualTo(structure.pos))
        );
    });

    if (highlyDamagedStructs.length) {
        highlyDamagedStructs.sort((a, b) => a.hits - b.hits);
        var mostDamagedStructure = highlyDamagedStructs[0];

        for (var t of highlyDamagedStructs) {
            new RoomVisual().text(t.hits, t.pos, {
                align: "right",
                font: 0.2,
            });
        }
        // damagedStructures.forEach((e, i) => (new RoomVisual().text(e.hits + " Order: " + i, e.pos, {align: 'left'})));

        if (mostDamagedStructure) {
            room.visual.circle(mostDamagedStructure.pos, {
                stroke: "green",
                radius: 0.5,
                lineStyle: "dashed",
                fill: "transparent",
            });
            for (var tower of towers) {
                tower.repair(mostDamagedStructure);
            }
            return 1
        }
    } else if(customStructureSpecificPercentLimits.length) {
        //customStructureSpecificPercent
        customStructureSpecificPercentLimits.sort((a, b) => a.hits - b.hits);
        for (var tower of towers) {
            // console.log(tower)
            closestTarget = tower.pos.findClosestByRange(customStructureSpecificPercentLimits);
    
            for (var t of customStructureSpecificPercentLimits) {
                new RoomVisual().text(t.hits, t.pos, {
                    align: "right",
                    font: 0.2,
                });
            }
            // damagedStructures.forEach((e, i) => (new RoomVisual().text(e.hits + " Order: " + i, e.pos, {align: 'left'})));
    
            tower.room.visual.circle(closestTarget.pos, {
                stroke: "green",
                radius: 0.5,
                lineStyle: "dashed",
                fill: "transparent",
            });
            tower.repair(closestTarget);
        }
        return 1;
    }
    
    return 0;
    
    

}