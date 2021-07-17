var roleHarvester = require('role.harvester');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');
var roleTower = require('tower');
var roleClaimer = require('role.claimer');
var roleMover = require('role.mover');
var roleDefence = require('role.defense');
var roleScavenger = require('role.scavenger');

function getRandomInt(min = 100, max = 999) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function getBodyCost(bodyParts) {
    return _.sum(bodyParts, b => BODYPART_COST[b]);
}

focusHealing = false

spawnCreep = function (_role, customBodyParts = null, customMemory = null) {

    if (customBodyParts) {
        // console.log("customActivated")
        oldBodyParts = _role.BodyParts
        _role.BodyParts = customBodyParts
    }
    if (Game.spawns['Spawn1'].room.energyAvailable >= getBodyCost(_role.BodyParts) && !Game.spawns['Spawn1'].spawning) {
        var newName = _.capitalize(_role.name) + '_' + getRandomInt();
        console.log('Spawning new ' + _role.name + ' : ' + newName);

        ret = Game.spawns['Spawn1'].spawnCreep(_role.BodyParts, newName,
            _.merge(
                {
                    memory: {
                        role: _role.name,
                        currentSource: '0',
                        baseRoomName: Game.spawns['Spawn1'].room.name,
                    }
                },
                _role.memory,
                customMemory
            ));
        if (ret != 0) {
            console.log("Spawn failed: ", ret)
        }
    }
    else {
        new RoomVisual().text('Next Spawn: ' + _.capitalize(_role.name), 1, 33, { align: 'left' });
        new RoomVisual().text('Cost: ' + getBodyCost(_role.BodyParts), 1, 34, { align: 'left' });
    }

    if (customBodyParts) {
        // console.log("customDeactivated")
        _role.BodyParts = oldBodyParts
    }
}

var spawn = Game.spawns['Spawn1']

module.exports.loop = function () {
    var towers = spawn.room.find(FIND_STRUCTURES, {
        filter: (structure) => {
            return (structure.structureType == STRUCTURE_TOWER);
        }
    });

    for (var t of towers) {
        roleTower.run(t);
    }

    for (var i in Memory.creeps) {
        if (!Game.creeps[i]) {
            delete Memory.creeps[i];
        }
    }

    _.forEach(Game.rooms, room => {
        let eventLog = room.getEventLog();
        let attackEvents = _.filter(eventLog, { event: EVENT_ATTACK });
        attackEvents.forEach(event => {
            let target = Game.getObjectById(event.data.targetId);
            if (target && target.my) {
                console.log(event);
            }
        });
    });

    var harvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'harvester');
    var builders = _.filter(Game.creeps, (creep) => creep.memory.role == 'builder');
    var upgraders = _.filter(Game.creeps, (creep) => creep.memory.role == 'upgrader');
    var movers = _.filter(Game.creeps, (creep) => creep.memory.role == 'mover');
    var constructionSites = [];
    _.forEach(Game.rooms, room => { constructionSites.push({roomName: room.name, numberOfSites: room.find(FIND_CONSTRUCTION_SITES).length}) } )
        
    var totalExcessEnergy = _.sum(
        spawn.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType == STRUCTURE_STORAGE);
            }
        }), s => s.store[RESOURCE_ENERGY]
    )

    // Creep info
    new RoomVisual().text('⚡️ ExcessEnergy: ' + totalExcessEnergy, 1, 25, { align: 'left' });
    new RoomVisual().text('⚡️ Energy: ' + Game.spawns['Spawn1'].room.energyAvailable, 1, 26, { align: 'left' });
    new RoomVisual().text('⛏️ Harvesters: ' + harvesters.length, 1, 27, { align: 'left' });
    new RoomVisual().text('⛏️ Movers: ' + movers.length, 1, 28, { align: 'left' });
    new RoomVisual().text('👷 Builders: ' + builders.length, 1, 29, { align: 'left' });
    new RoomVisual().text('🚧 Construction sites: ' + constructionSites[0].roomName + ' ' + constructionSites[0].numberOfSites, 1, 30, { align: 'left' });
    new RoomVisual().text('🚧 Construction sites: ' + constructionSites[1].roomName + ' ' + constructionSites[1].numberOfSites, 1, 31, { align: 'left' });
    _.forEach(constructionSites, cs => { cs.numberOfSites } )
    new RoomVisual().text('🔺Upgraders: ' + upgraders.length, 1, 32, { align: 'left' });

    // Renew or Build
    for (var s in Game.spawns)
        for (var i in Game.creeps) {
            if (Game.spawns[s].renewCreep(Game.creeps[i])) {
                Game.creeps[i].cancelOrder('move');
            }
        }

    if (Memory.createClaimer) {
        if (spawnCreep(roleClaimer) == 0) {
            Memory.createClaimer = false;
        }
    }
    else if (harvesters.length < 1) {
        BaseBodyParts = [WORK, CARRY, CARRY, MOVE, MOVE];
        spawnCreep(roleHarvester, BaseBodyParts);
    }
    else if (movers.length < 1) {
        spawnCreep(roleMover);
    }
    else if (harvesters.length < 2) {
        spawnCreep(roleHarvester);
    }
    else if (upgraders.length < 2) {
        spawnCreep(roleUpgrader);
    }
    else if (builders.length < constructionSites[0].numberOfSites &&
        builders.length < 6) {
        spawnCreep(roleBuilder, null, { memory: {baseRoomName: constructionSites[0].roomName }});
    }
    else if (builders.length < constructionSites[1].numberOfSites &&
        builders.length < 6) {
        spawnCreep(roleBuilder, null, { memory: {baseRoomName: constructionSites[1].roomName }});
    }
    else if (movers.length < 2) {
        spawnCreep(roleMover);
    }
    else if (upgraders.length < 10) {
        spawnCreep(roleUpgrader);
    }
    else if (upgraders.length < 15) {
        spawnCreep(roleUpgrader, null, { memory: {baseRoomName: "W15S21" }},);
    }
    else if (constructionSites == 0 && upgraders.length < 20) {
        spawnCreep(roleUpgrader, null, { memory: {baseRoomName: "W15S21" }},);
    }



    if (spawn.spawning) {
        var spawningCreep = Game.creeps[spawn.spawning.name];
        spawn.room.visual.text(
            '🛠️' + spawningCreep.memory.role,
            spawn.pos.x + 1,
            spawn.pos.y,
            { align: 'left', opacity: 0.8 });
    }

    for (var name in Game.creeps) {
        var creep = Game.creeps[name];
        var closestHostile = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if (closestHostile) {
            roleDefence.run(creep)
            continue
        }
        if (creep.memory.role == 'upgrader' && harvesters.length < 1) {
            roleHarvester.run(creep);
            continue
        }
        if (creep.memory.role == 'harvester') {
            roleHarvester.run(creep, focusHealing);
        }
        if (creep.memory.role == 'upgrader') {
            roleUpgrader.run(creep);
        }
        if (creep.memory.role == 'builder') {
            roleBuilder.run(creep);
        }
        if (creep.memory.role == 'claimer') {
            roleClaimer.run(creep);
        }
        if (creep.memory.role == 'mover') {
            if (creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES)) {
                roleScavenger.run(creep)
                continue
            }
            roleMover.run(creep);
        }
    }

    // Renew
    for (var i in Game.creeps) {
        if (spawn.renewCreep(Game.creeps[i]) == 0) {
            Game.creeps[i].cancelOrder('move');
        }
    }

    // THIS IS ALL USING THE LAST CREEP IN GAME.CREEPS, AND IS THEREFORE NOT RIGHT
    // Auto roads
    for (var room in Game.rooms) {
        room = Game.rooms[room]
        if (room.controller.my) {
            var sources = room.find(FIND_SOURCES);
            for (var s in sources) {
                // Sources to controller
                for (var pathStep of sources[s].pos.findPathTo(room.controller.pos, { "ignoreCreeps": true, "ignoreRoads": true })) {
                    room.visual.circle(pathStep, {color: 'red', lineStyle: 'dashed'});
                    if (/*new Room.Terrain(room.name).get(pathStep.x, pathStep.y) == TERRAIN_MASK_SWAMP &&*/
                            room.lookForAt(LOOK_STRUCTURES, pathStep.x, pathStep.y).length == 0) {
                        // room.visual.circle(pathStep, {color: 'green', lineStyle: 'dashed'});
                        room.createConstructionSite(pathStep.x, pathStep.y, STRUCTURE_ROAD);
                    }
                }
                // Sources to spawns
                room_spawner = room.find(FIND_STRUCTURES, {
                        filter: (structure) => {
                            return (structure.structureType == STRUCTURE_SPAWN);
                        }
                    });
                for (var pathStep of sources[s].pos.findPathTo(room_spawner, { "ignoreCreeps": true, "ignoreRoads": true })) {
                    // room.visual.circle(pathStep, {color: 'red', lineStyle: 'dashed'});
                    if (new Room.Terrain(room.name).get(pathStep.x, pathStep.y) == TERRAIN_MASK_SWAMP &&
                        room.lookForAt(LOOK_STRUCTURES, pathStep.x, pathStep.y).length == 0
                    ) {
                        // room.visual.circle(pathStep, {fill: 'green'});
                        room.createConstructionSite(pathStep.x, pathStep.y, STRUCTURE_ROAD);
                    }
                }
                // Source surroundings
                for (var i = sources[s].pos.x - 2; i <= sources[s].pos.x + 2; i++) {
                    for (var j = sources[s].pos.y - 2; j <= sources[s].pos.y + 2; j++) {
                        var surr = new RoomPosition(i, j, room.name)
                        if (new Room.Terrain(room.name).get(surr.x, surr.y) == TERRAIN_MASK_SWAMP) {
                            // room.visual.circle(surr, {fill: 'green'});
                            room.createConstructionSite(surr.x, surr.y, STRUCTURE_ROAD);
                        }
                    }
                }
                // Sources to spawns
                room_towers = room.find(FIND_STRUCTURES, {
                        filter: (structure) => {
                            return (structure.structureType == STRUCTURE_TOWER);
                        }
                    });
                // Source to towers
                for (var t of room_towers) {
                    for (var pathStep of sources[s].pos.findPathTo(t.pos, { "ignoreCreeps": true, "ignoreRoads": true })) {
                        if (new Room.Terrain(room.name).get(pathStep.x, pathStep.y) != TERRAIN_MASK_SWAMP &&
                            room.lookForAt(LOOK_STRUCTURES, pathStep.x, pathStep.y).length == 0) {
                            // room.visual.circle(pathStep, {color: 'green', lineStyle: 'dashed'});
                            room.createConstructionSite(pathStep.x, pathStep.y, STRUCTURE_ROAD);
                        }
                    }
                }
            }
        }
    }
    room.createConstructionSite(Game.flags.T1.pos, STRUCTURE_TOWER)

}

