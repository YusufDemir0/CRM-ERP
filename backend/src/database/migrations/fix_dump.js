const fs = require('fs');
const path = require('path');

const dumpFile = path.join(__dirname, 'dump.sql');
let content = fs.readFileSync(dumpFile, 'utf8');

// 1. departments DDL
content = content.replace(
  /(`commercial_account_id` bigint\(20\) DEFAULT NULL,)/,
  '$1\n  `city_id` int(11) DEFAULT NULL,'
);

// 2. items DDL
content = content.replace(
  /(`kdv` decimal\(5,2\) NOT NULL DEFAULT 20.00,)/,
  '$1\n  `total_stock` decimal(15,4) NOT NULL DEFAULT 0.0000,'
);

// 3. sales DDL
content = content.replace(
  /(`grand_total` decimal\(15,2\) NOT NULL DEFAULT 0.00,)/,
  '$1\n  `total_cost` decimal(15,2) NOT NULL DEFAULT 0.00,\n  `profit` decimal(15,2) NOT NULL DEFAULT 0.00,'
);

// 4. departments VALUES
// (3,'izmit depoKKKW','İZMİT DEPO - ( MOPAŞ )QQQW','DİZMQQQW',NULL,NULL,1,'2026...
// 6th param is commercial_account_id, 7th is created_by
content = content.replace(
  /\((\d+),([^,]+),([^,]+),([^,]+),([^,]+),([^,]+),(\d+|NULL),('[^']+'),(\d+|NULL),('[^']+'),([^,]+),([^)]+)\)/g,
  (match, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12) => {
    // Only apply to departments insert (by checking if p1 is one of the known dept IDs)
    if (['3','4','5','6','10'].includes(p1) && p4.includes("'") && !p2.includes("kavanoz")) {
       return `(${p1},${p2},${p3},${p4},${p5},${p6},NULL,${p7},${p8},${p9},${p10},${p11},${p12})`;
    }
    return match;
  }
);

// We need a more precise regex for departments insert values
// Let's just do standard string replacements for the known rows since there are only 5 of them:
const deptRows = [
  { old: "(3,'izmit depoKKKW','İZMİT DEPO - ( MOPAŞ )QQQW','DİZMQQQW',NULL,NULL,1,'2026-04-01 18:24:39.000000',1,'2026-04-04 11:56:15.000000','2026-04-04 11:56:15.000000',1)", new: "(3,'izmit depoKKKW','İZMİT DEPO - ( MOPAŞ )QQQW','DİZMQQQW',NULL,NULL,NULL,1,'2026-04-01 18:24:39.000000',1,'2026-04-04 11:56:15.000000','2026-04-04 11:56:15.000000',1)" },
  { old: "(4,'SAKARYA MAĞAZA','SEZER SAKARYA','MADA',2,2,1,'2026-04-07 18:43:09.300894',NULL,'2026-04-07 18:43:09.300894',NULL,1)", new: "(4,'SAKARYA MAĞAZA','SEZER SAKARYA','MADA',2,2,NULL,1,'2026-04-07 18:43:09.300894',NULL,'2026-04-07 18:43:09.300894',NULL,1)" },
  { old: "(5,'ÇORLU MAĞAZA','ÖMER SORUMLU','MCOR',2,3,1,'2026-04-07 18:45:12.731921',1,'2026-04-16 17:15:04.000000',NULL,1)", new: "(5,'ÇORLU MAĞAZA','ÖMER SORUMLU','MCOR',2,3,NULL,1,'2026-04-07 18:45:12.731921',1,'2026-04-16 17:15:04.000000',NULL,1)" },
  { old: "(6,'MERKEZ DEPO(IST)','ISMAIL ŞAHIN','DIST',2,4,1,'2026-04-07 18:47:38.890289',1,'2026-04-11 18:36:10.000000',NULL,1)", new: "(6,'MERKEZ DEPO(IST)','ISMAIL ŞAHIN','DIST',2,4,NULL,1,'2026-04-07 18:47:38.890289',1,'2026-04-11 18:36:10.000000',NULL,1)" },
  { old: "(10,'İZMİT MAĞAZA','BAYRAM KARACA','MERM',2,1,1,'2026-04-11 18:30:24.632395',1,'2026-04-16 02:23:34.000000',NULL,1)", new: "(10,'İZMİT MAĞAZA','BAYRAM KARACA','MERM',2,1,NULL,1,'2026-04-11 18:30:24.632395',1,'2026-04-16 02:23:34.000000',NULL,1)" },
];

for (const row of deptRows) {
  content = content.replace(row.old, row.new);
}

// 5. items VALUES
// We need to inject '0.0000,' after the kdv value. kdv is the 14th value.
// It's usually '20.00,' or '10.00,'
// Let's replace the whole items insert section manually or with regex.
// Since we only have 11 items, it's safer to use regex that matches the first 14 columns
content = content.replace(
  /(\(\d+,'[^']+',\d+,'[^']+',(?:NULL|\d+),\d+\.\d+,(?:'[^']*'|NULL),\d+\.\d+,\d+\.\d+,(?:NULL|\d+\.\d+),(?:NULL|\d+\.\d+),(?:NULL|\d+),\d+,\d+\.\d+,)/g,
  '$10.0000,'
);

fs.writeFileSync(dumpFile, content, 'utf8');
console.log('dump.sql updated successfully.');
