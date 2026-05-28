const fs = require('fs');
const filePath = '/Users/iv4n2k/Documents/innover-remotion-ad/src/LoaderAd.tsx';
const lines = fs.readFileSync(filePath, 'utf8').split('\n');
for (let i = 798; i < 822; i++) {
  console.log(`${i + 1}: [${lines[i]}]`);
}
