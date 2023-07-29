const fs = require('fs');

function appendJSON(fileDir, obj) {
    fs.readFile(fileDir, 'utf-8', (error, file) => {
        if (error) {
            console.error(`\u001b[31m Could not read ${fileDir}`);
            return;
        }
        
        data = JSON.parse(file);
        data.push(obj);
        data = JSON.stringify(data, null, 4);
        fs.writeFile(fileDir, data, (error => {
            if (error) console.error(`\u001b[31m Could not write ${fileDir}`);
            else console.info(`\u001b[32m JSON appened to ${fileDir}!\n${JSON.stringify(obj)}`);
        }));
    });
}

function removeJSON(fileDir, findFunc) {
    fs.readFile(fileDir, 'utf-8', (error, file) => {
        if (error) {
            console.error(`\u001b[31m Could not read ${fileDir}`);
            return;
        }
        
        data = JSON.parse(file);
        data.splice(data.findIndex(findFunc), 1);
        data = JSON.stringify(data, null, 4);
        fs.writeFile(fileDir, data, (error => {
            if (error) console.error(`\u001b[31m Could not write ${fileDir}`);
            else console.info(`\u001b[32m JSON deleted from ${fileDir}!`);
        }));
    });
}

module.exports.appendJSON = appendJSON;
module.exports.removeJSON = removeJSON;