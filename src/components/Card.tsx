import React from 'react'
import './Card.css'
// svg heart is in src/assets/icons/hearth.svg (import as module)
import heartUrl from '../assets/icons/hearth.svg'
import attackUrl from '../assets/icons/attack.svg'

type CardProps = {
  width?: number
  height?: number
  cost: number | string
  artUrl?: string
  name: string
  text?: string
  attack: number | string
  label?: string
  health: number | string
}

export default function Card({
  width = 300,
  height = 440,
  cost,
  artUrl,
  name,
  text,
  attack,
  label,
  health,
}: CardProps) {
  const style: React.CSSProperties = { width, height }

  return (
    <div className="cg-card" style={style}>
      <div className="cg-frame">
        <div className="cg-cost">
          <div className="cg-cost-octagon">{cost}</div>
        </div>

        <div className="cg-art">
          {artUrl ? (
            <img src={artUrl} alt={name} className="w-full h-full object-contain bg-transparent" />
          ) : (
            <div className="cg-art-placeholder">ARTPLACEHOLDER</div>
          )}
        </div>

        <div className="cg-name">{name}</div>

        <div className="cg-text">{text}</div>

        <div className="cg-stats">
          <div className="cg-attack">
            <img src={attackUrl} alt="atk" className="cg-attack-icon" />
            <div className="cg-attack-value">{attack}</div>
          </div>
          <div className="cg-label">{label}</div>
          <div className="cg-health">
            <img src={heartUrl} alt="hp" className="cg-health-icon" />
            <div className="cg-health-value">{health}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
