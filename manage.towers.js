var towerRangeImpactFactor = function(distance) {
  if(distance <= TOWER_OPTIMAL_RANGE) {
   return 1
  }
  if(distance >= TOWER_FALLOFF_RANGE) {
    return 1 - TOWER_FALLOFF
  }
  var towerFalloffPerTile = TOWER_FALLOFF / (TOWER_FALLOFF_RANGE - TOWER_OPTIMAL_RANGE)
  return 1 - (distance - TOWER_OPTIMAL_RANGE) * towerFalloffPerTile
}

global.runTowers = function (room) {
    var towers = room.find(FIND_STRUCTURES, {
        filter: (structure) => {
            return structure.structureType == STRUCTURE_TOWER;
        },
    });
    
    percentageBased = true;

    var highlyDamagedStructFound = tower.room.find(FIND_STRUCTURES, {
        filter: (structure) =>
            (structure.structureType == STRUCTURE_ROAD && Math.round((structure.hits / structure.hitsMax) * 100 < 5)) || (structure.structureType == STRUCTURE_WALL && Math.round((structure.hits / structure.hitsMax) * 100 < 0.01)),
    });

    var customStructureSpecificPercentLimits = tower.room.find(FIND_STRUCTURES, {
        filter: (structure) =>
            (structure.structureType == STRUCTURE_ROAD && Math.round((structure.hits / structure.hitsMax) * 100 < 50)) ||
            (structure.structureType == STRUCTURE_RAMPART && Math.round((structure.hits / structure.hitsMax) * 100 < 0.6)) ||
            (structure.structureType == STRUCTURE_WALL && Math.round((structure.hits / structure.hitsMax) * 100 < 0.02)),
    });

    var closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
    var allHostiles = tower.room.find(FIND_HOSTILE_CREEPS);
    var healer = null;
    var healerCount = null;
    const reducer = (accumulator, currentBodyPart) => {
        if(currentBodyPart.type == HEAL && currentBodyPart.hits > 0) accumulator+=1
        if(currentBodyPart.type == HEAL && currentBodyPart.hits > 0 && currentBodyPart.boost != undefined) accumulator+=1
        
    }
    for (var h of allHostiles) {
        healparts = bparts.reduce(reducer);
        if(healerCount < healparts)
            healer = h;
            healerCount = healparts;
        }
    }

    if (healer) {
        
        for(var t of towers)
            damage += TOWER_POWER_ATTACK * towerRangeImpactFactor(t.getRangeTo(healer))
            
        if (damage > healerCount * 12)
            for(var t of towers)
                t.attack(healer)

            
    }

    if (closestHostile) {
        tower.attack(closestHostile);
        return;
    }
    var closestCreep = tower.pos.findClosestByRange(FIND_CREEPS, {
        filter: (creep) => Math.round((creep.hits / creep.hitsMax) * 100 < 99),
    });
    if (closestCreep) {
        tower.heal(closestCreep);
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


};
