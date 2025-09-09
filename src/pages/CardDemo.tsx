import Card from '../components/Card'

export default function CardDemo() {
  return (
    <div style={{ padding: 24 }}>
      <h2>Card demo</h2>
      <Card
        width={320}
        height={480}
        cost={2}
        name={'Zealous Hare'}
  text={'Charge. After this attacks, go Dormant for 2 turns and summon a 3/4 Turtle with Taunt for your opponent. (demo)'}
  attack={4}
  label={'Taunt'}
        health={2}
      />
    </div>
  )
}
