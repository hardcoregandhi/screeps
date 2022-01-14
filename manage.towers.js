getStructureHealLimit = function (room, structure) {
    var wallHealPercent = room.controller.level * 0.01;
    
    switch(structure.structureType) {
        case (STRUCTURE_ROAD):
            return Math.round((structure.hits / structure.hitsMax) * 100 < 50)
        case (STRUCTURE_CONTAINER):
            return Math.round((structure.hits / structure.hitsMax) * 100 < 50)
        case (STRUCTURE_RAMPART):
            return Math.round((structure.hits / structure.hitsMax) * 100) < wallHealPercent
        case (STRUCTURE_WALL):
            return Math.round((structure.hits / structure.hitsMax) * 100 < wallHealPercent)
    }
    
}

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
    var towers = [];
    _.forEach(Memory.rooms[room.name].towers, (t) => {
        // console.log(towerId)
        towers.push(Game.getObjectById(t.id));
    })

    if (!towers.length) return;


    // startCpu = Game.cpu.getUsed();
    if (attack(room, towers)) return;
    // elapsed = Game.cpu.getUsed() - startCpu;
    // console.log("attack has used " + elapsed + " CPU time");
    
    // startCpu = Game.cpu.getUsed();
    if (heal(room, towers)) return;
    // elapsed = Game.cpu.getUsed() - startCpu;
    // console.log("heal has used " + elapsed + " CPU time");

    // startCpu = Game.cpu.getUsed();
    if (repair(room, towers)) return;
    // elapsed = Game.cpu.getUsed() - startCpu;
    // console.log(room.name + " repair has used " + elapsed + " CPU time");
};

attack = function (room, towers) {
    var allHostiles = room.find(FIND_HOSTILE_CREEPS);
    if (!allHostiles.length) {
        Memory.rooms[room.name].mainTower.enemyInRoom = false;
        return 0;
    }
    Memory.rooms[room.name].mainTower.enemyInRoom = true;
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
                console.log(`healer found in ${room.name}`);
                healer = h;
                healerCount = healparts;
            }
        }

        var potentialAttackDamage = 0;
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
            return 1;
        }
    } catch (e) {
        console.log(`tower failed: ${e}`);
    }
    console.log("no healer found, firing at will");
    for (var t of towers) {
        var closestHostile = t.pos.findClosestByRange(allHostiles);
        if (closestHostile) {
            console.log(t.attack(closestHostile));
        }
    }
    return 1;
};

heal = function (room, towers) {
    var hurtCreeps = room.find(FIND_MY_CREEPS).filter((creep) => {
        return Math.round((creep.hits / creep.hitsMax) * 100 < 99);
    });
    if (hurtCreeps.length) {
        for (var tower of towers) {
            tower.heal(hurtCreeps[0]);
        }
    }
    if (hurtCreeps.length) {
        return 1;
    } else {
        return 0;
    }
};

repair = function (room, towers) {
    
    if (room.energyAvailable <= 2500) return 0;
    
    var wallHealPercent = room.controller.level * 0.01;
    
    var highlyDamagedStructs = room.find(FIND_STRUCTURES).filter((structure) => {
        return (
            (structure.structureType == STRUCTURE_ROAD && Math.round((structure.hits / structure.hitsMax) * 100) < 5) ||
            (structure.structureType == STRUCTURE_RAMPART && Math.round((structure.hits / structure.hitsMax) * 100) < 0.01) ||
            (structure.structureType == STRUCTURE_WALL && Math.round((structure.hits / structure.hitsMax) * 100 < wallHealPercent / 10) && (Game.flags.DISMANTLE == undefined || !Game.flags.DISMANTLE.pos.isEqualTo(structure.pos)))
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
            return 1;
        }
    }
    
    // first check cached target
    for (var tower of towers) {
        // console.log(tower)
        if (Memory.rooms[tower.room.name].towers[tower.id].currentTarget != null) {
            target = Game.getObjectById(Memory.rooms[tower.room.name].towers[tower.id].currentTarget)
            if (target != undefined && target.hits < getStructureHealLimit(room, target)) {
                tower.heal(target)
                _.remove(towers, tower)
            } else {
                Memory.rooms[tower.room.name].towers[tower.id].currentTarget = null
            }
        }
    }
    if(!towers.length) return
    
    var customStructureSpecificPercentLimits = room.find(FIND_STRUCTURES).filter((structure) => {
        return (
            getStructureHealLimit(room, structure) && (Game.flags.DISMANTLE == undefined || !Game.flags.DISMANTLE.pos.isEqualTo(structure.pos))
        );
    });
    if (customStructureSpecificPercentLimits.length) {
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
            Memory.rooms[tower.room.name].towers[tower.id].currentTarget = closestTarget.id
            
            
        }
        return 1;
    }

    return 0;
};
