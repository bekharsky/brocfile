export default function() {
  if (typeof window === 'undefined' && typeof global !== 'undefined') {
    console.log('Build is OK.');
    global.process.exit();
  }
}