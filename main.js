var roleHarvester = require('role.harvester');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');
var roleTower = require('tower');
var roleClaimer = require('role.claimer');
var roleMover = require('role.mover');

function getRandomInt(min = 100, max = 999) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function getBodyCost(bodyParts) {
    return _.sum(bodyParts, b => BODYPART_COST[b]);
}

BaseBodyParts = [WORK, CARRY, WORK, CARRY, WORK, MOVE, MOVE]
BaseBodyPartsCost = _.sum(BaseBodyParts, b => BODYPART_COST[b]);
focusHealing = false

function spawnHarvester() {
    if(Game.spawns['Spawn1'].room.energyAvailable >= BaseBodyPartsCost) {
        var newName = 'Harvester' + '_' + getRandomInt();
        console.log('Spawning new harvester: ' + newName);
        Game.spawns['Spawn1'].spawnCreep(BaseBodyParts, newName, {memory: {role: 'harvester', currentSource: '0'}});
    }
    else {
        new RoomVisual().text('Next Spawn: Harvester', 1, 32, {align: 'left'}); 
        new RoomVisual().text('Cost: ' + _.sum(BaseBodyParts, b => BODYPART_COST[b]), 1, 33, {align: 'left'}); 
    }
}
function spawnBuilder() {
    if(Game.spawns['Spawn1'].room.energyAvailable >= getBodyCost(roleBuilder.BodyParts)) {
        var newName = 'Builder' + '_' + getRandomInt();
        console.log('Spawning new Builder: ' + newName);
        Game.spawns['Spawn1'].spawnCreep(roleBuilder.BodyParts, newName, {memory: {role: 'builder', currentSource: '0'}});
    }
    else {
        new RoomVisual().text('Next Spawn: Builder', 1, 32, {align: 'left'}); 
        new RoomVisual().text('Cost: ' + getBodyCost(roleBuilder.BodyParts), 1, 33, {align: 'left'}); 
    }
}
function spawnUpgrader() {
    if(Game.spawns['Spawn1'].room.energyAvailable >= getBodyCost(roleUpgrader.BodyParts)) {
        var newName = 'Upgrader' + '_' + getRandomInt();
        console.log('Spawning new Upgrader: ' + newName);
        Game.spawns['Spawn1'].spawnCreep(roleUpgrader.BodyParts, newName, {memory: {role: 'upgrader', currentSource: '0'}});
    }
    else {
        new RoomVisual().text('Next Spawn: Upgrader', 1, 32, {align: 'left'}); 
        new RoomVisual().text('Cost: ' + getBodyCost(roleUpgrader.BodyParts), 1, 33, {align: 'left'}); 
    }
}
function spawnClaimer() {
    if(Game.spawns['Spawn1'].room.energyAvailable >= _.sum(roleClaimer.BodyParts, b => BODYPART_COST[b])) {
        var newName = 'Claimer' + '_' + getRandomInt();
        console.log('Spawning new Claimer: ' + newName);
        if(Game.spawns['Spawn1'].spawnCreep(roleClaimer.BodyParts, newName, {memory: {role: 'claimer', HomeSpawnName: Game.spawns['Spawn1'].room.name, direction: 3}})) {
            Memory.createClaimer = false;
        }
    }
    else {
        new RoomVisual().text('Next Spawn: Claimer', 1, 32, {align: 'left'});
        new RoomVisual().text('Cost: ' + _.sum(roleClaimer.BodyParts, b => BODYPART_COST[b]), 1, 33, {align: 'left'}); 
    }
}
function spawnMover() {
    if(Game.spawns['Spawn1'].room.energyAvailable >= _.sum(roleMover.BodyParts, b => BODYPART_COST[b])) {
        var newName = 'Mover' + '_' + getRandomInt();
        console.log('Spawning new Mover: ' + newName);
        Game.spawns['Spawn1'].spawnCreep(roleMover.BodyParts, newName, {memory: {role: 'mover'}})
    }
    else {
        new RoomVisual().text('Next Spawn: Mover', 1, 32, {align: 'left'});
        new RoomVisual().text('Cost: ' + _.sum(roleMover.BodyParts, b => BODYPART_COST[b]), 1, 33, {align: 'left'}); 
    }
}
var spawn = Game.spawns['Spawn1']

module.exports.loop = function () {
    var towers = spawn.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType == STRUCTURE_TOWER);
            }
        });

    for(var t of towers) {
        roleTower.run(t);
    }
    
    for(var i in Memory.creeps) {
        if(!Game.creeps[i]) {
            delete Memory.creeps[i];
        }
    }
    
    _.forEach(Game.rooms, room => {
        let eventLog = room.getEventLog();
        let attackEvents = _.filter(eventLog, {event: EVENT_ATTACK});
        attackEvents.forEach(event => {
            let target = Game.getObjectById(event.data.targetId);
            if(target && target.my) {
                console.log(event);
            }
        });
    });
    
    var harvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'harvester');
    var builders = _.filter(Game.creeps, (creep) => creep.memory.role == 'builder');
    var upgraders = _.filter(Game.creeps, (creep) => creep.memory.role == 'upgrader');
    var movers = _.filter(Game.creeps, (creep) => creep.memory.role == 'mover');
    
    var totalExcessEnergy = _.sum(
        spawn.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType == STRUCTURE_STORAGE);
            }
        }), s => s.store[RESOURCE_ENERGY]
    )
    
    // Creep info
    new RoomVisual().text('⚡️ ExcessEnergy: ' + totalExcessEnergy, 1, 25, {align: 'left'}); 
    new RoomVisual().text('⚡️ Energy: ' + Game.spawns['Spawn1'].room.energyAvailable, 1, 26, {align: 'left'}); 
    new RoomVisual().text('⛏️ Harvesters: ' + harvesters.length, 1, 27, {align: 'left'}); 
    new RoomVisual().text('⛏️ Movers: ' + movers.length, 1, 28, {align: 'left'}); 
    new RoomVisual().text('👷 Builders: ' + builders.length, 1, 29, {align: 'left'}); 
    new RoomVisual().text('🚧 Construction sites: ' + spawn.room.find(FIND_CONSTRUCTION_SITES).length, 1, 30, {align: 'left'}); 
    new RoomVisual().text('🔺Upgraders: ' + upgraders.length, 1, 31, {align: 'left'}); 

    // Renew or Build
    for(var i in Game.creeps) {
        if(spawn.renewCreep(Game.creeps[i])){
            Game.creeps[i].cancelOrder('move');
        }
    }
    
    if (Memory.createClaimer) {
        spawnClaimer();
    }
    else if (harvesters.length < 1) {
        oldBodyParts = BaseBodyParts;
        BaseBodyParts = [WORK, CARRY, CARRY, MOVE, MOVE];
        BaseBodyPartsCost = _.sum(BaseBodyParts, b => BODYPART_COST[b]);
        spawnHarvester();
        BaseBodyParts = oldBodyParts;
    }
    else if (movers.length < 1) {
        spawnMover();
    }
    else if(harvesters.length < 2) {
        spawnHarvester();
    }
    else if (upgraders.length < 2) {
        spawnUpgrader();
    }
    else if(builders.length < spawn.room.find(FIND_CONSTRUCTION_SITES).length &&
            builders.length < 1) {
        spawnBuilder();
    }
    else if (movers.length < 2) {
        spawnMover();
    }
    else if(upgraders.length < 10) {
        spawnUpgrader();
    }

    

    if(Game.spawns['Spawn1'].spawning) { 
        var spawningCreep = Game.creeps[Game.spawns['Spawn1'].spawning.name];
        Game.spawns['Spawn1'].room.visual.text(
            '🛠️' + spawningCreep.memory.role,
            Game.spawns['Spawn1'].pos.x + 1, 
            Game.spawns['Spawn1'].pos.y, 
            {align: 'left', opacity: 0.8});
    }

    for(var name in Game.creeps) {
        var creep = Game.creeps[name];
        if(creep.memory.role == 'harvester') {
            roleHarvester.run(creep, focusHealing);
        }
        if(creep.memory.role == 'upgrader') {
            roleUpgrader.run(creep);
        }
        if(creep.memory.role == 'builder') {
            roleBuilder.run(creep);
        }
        if(creep.memory.role == 'claimer') {
            roleClaimer.run(creep);
        }
        if(creep.memory.role == 'mover') {
            roleMover.run(creep);
        }
    }
    
    // Renew
    for(var i in Game.creeps) {
        if(spawn.renewCreep(Game.creeps[i]) == 0){
            Game.creeps[i].cancelOrder('move');
        }
    }
    
    // THIS IS ALL USING THE LAST CREEP IN GAME.CREEPS, AND IS THEREFORE NOT RIGHT
    // Auto roads
    if(creep && creep.room.controller.my){
        var sources = creep.room.find(FIND_SOURCES);
        for(var s in sources) {
            // Sources to controller
            for(var pathStep of sources[s].pos.findPathTo(Game.spawns['Spawn1'].room.controller.pos, { "ignoreCreeps": true, "ignoreRoads": true })) {
                if(new Room.Terrain(creep.room.name).get(pathStep.x, pathStep.y) == TERRAIN_MASK_SWAMP) {
                    // creep.room.visual.circle(pathStep, {color: 'red', lineStyle: 'dashed'});
                    creep.room.createConstructionSite(pathStep.x, pathStep.y, STRUCTURE_ROAD);
                }
            }
            // Sources to spawns
            for(var pathStep of sources[s].pos.findPathTo(spawn.pos, { "ignoreCreeps": true, "ignoreRoads": true })) {
                if(new Room.Terrain(creep.room.name).get(pathStep.x, pathStep.y) == TERRAIN_MASK_SWAMP &&
                    creep.room.lookForAt(LOOK_STRUCTURES, pathStep.x, pathStep.y).length == 0
                ) {
                    // creep.room.visual.circle(pathStep, {fill: 'red'});
                    creep.room.createConstructionSite(pathStep.x, pathStep.y, STRUCTURE_ROAD);
                }
            }
            // Source surroundings
            for (var i = sources[s].pos.x -2; i <= sources[s].pos.x + 2; i++) {
                for (var j = sources[s].pos.y -2; j <= sources[s].pos.y + 2; j++) {
                    var surr = new RoomPosition(i, j, spawn.room.name)
                    if(new Room.Terrain(creep.room.name).get(surr.x, surr.y) == TERRAIN_MASK_SWAMP) {
                        // creep.room.visual.circle(surr, {fill: 'red'});
                        creep.room.createConstructionSite(surr.x, surr.y, STRUCTURE_ROAD);
                    }
                }
            }
            // Source to towers
            for(var t of towers) {
                for(var pathStep of sources[s].pos.findPathTo(t.pos, { "ignoreCreeps": true, "ignoreRoads": true })) {
                    if(new Room.Terrain(creep.room.name).get(pathStep.x, pathStep.y) != TERRAIN_MASK_SWAMP &&
                    creep.room.lookForAt(LOOK_STRUCTURES, pathStep.x, pathStep.y).length == 0) {
                        // creep.room.visual.circle(pathStep, {color: 'red', lineStyle: 'dashed'});
                        creep.room.createConstructionSite(pathStep.x, pathStep.y, STRUCTURE_ROAD);
                    }
                }
            }
    
        }
    }
    
}

