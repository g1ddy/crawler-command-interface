const inventory = [
  { instanceId: 'a', name: 'first' },
  { instanceId: 'a', name: 'second' }
];
const map = new Map();
for (const item of inventory) {
  if (item.instanceId && !map.has(item.instanceId)) {
    map.set(item.instanceId, item);
  }
}
console.log(map.get('a'));
