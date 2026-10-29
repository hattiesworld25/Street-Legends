"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Car, Crosshair, Heart, Cigarette, Zap, DollarSign, Trophy, Skull } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface Player {
  x: number
  y: number
  health: number
  money: number
  isInCar: boolean
  isDriving: boolean
  isSmoking: boolean
  ammo: number
  angle: number
  score: number
  currentVehicleId: string | null
}

interface Vehicle {
  id: string
  x: number
  y: number
  type: "sedan" | "sports" | "truck"
  color: string
  health: number
}

interface Enemy {
  id: string
  x: number
  y: number
  health: number
  angle: number
}

interface Bullet {
  id: string
  x: number
  y: number
  angle: number
  speed: number
}

interface Collectible {
  id: string
  x: number
  y: number
  type: "health" | "ammo" | "money"
}

const GAME_WIDTH = 800
const GAME_HEIGHT = 600
const PLAYER_SIZE = 30
const ENEMY_SIZE = 25
const VEHICLE_WIDTH = 50
const VEHICLE_HEIGHT = 35
const BULLET_SIZE = 5
const COLLECTIBLE_SIZE = 20

export default function StreetLegendsGame() {
  const [gameStarted, setGameStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [player, setPlayer] = useState<Player>({
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT / 2,
    health: 100,
    money: 0,
    isInCar: false,
    isDriving: false,
    isSmoking: false,
    ammo: 50,
    angle: 0,
    score: 0,
    currentVehicleId: null
  })
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [enemies, setEnemies] = useState<Enemy[]>([])
  const [bullets, setBullets] = useState<Bullet[]>([])
  const [collectibles, setCollectibles] = useState<Collectible[]>([])
  const [keys, setKeys] = useState<Record<string, boolean>>({})
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const gameRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number>(0)

  // Initialize game
  const initGame = () => {
    setPlayer({
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT / 2,
      health: 100,
      money: 0,
      isInCar: false,
      isDriving: false,
      isSmoking: false,
      ammo: 50,
      angle: 0,
      score: 0,
      currentVehicleId: null
    })
    setVehicles(generateVehicles(5))
    setEnemies(generateEnemies(3))
    setCollectibles(generateCollectibles(8))
    setBullets([])
    setGameOver(false)
    setGameStarted(true)
  }

  const generateVehicles = (count: number): Vehicle[] => {
    const types: ("sedan" | "sports" | "truck")[] = ["sedan", "sports", "truck"]
    const colors = ["#ef4444", "#3b82f6", "#22c55e", "#eab308", "#a855f7", "#ec4899"]
    return Array.from({ length: count }, (_, i) => ({
      id: `vehicle-${i}`,
      x: Math.random() * (GAME_WIDTH - VEHICLE_WIDTH),
      y: Math.random() * (GAME_HEIGHT - VEHICLE_HEIGHT),
      type: types[Math.floor(Math.random() * types.length)],
      color: colors[Math.floor(Math.random() * colors.length)],
      health: 100
    }))
  }

  const generateEnemies = (count: number): Enemy[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `enemy-${i}`,
      x: Math.random() * (GAME_WIDTH - ENEMY_SIZE),
      y: Math.random() * (GAME_HEIGHT - ENEMY_SIZE),
      health: 50,
      angle: Math.random() * Math.PI * 2
    }))
  }

  const generateCollectibles = (count: number): Collectible[] => {
    const types: ("health" | "ammo" | "money")[] = ["health", "ammo", "money"]
    return Array.from({ length: count }, (_, i) => ({
      id: `collectible-${i}`,
      x: Math.random() * (GAME_WIDTH - COLLECTIBLE_SIZE),
      y: Math.random() * (GAME_HEIGHT - COLLECTIBLE_SIZE),
      type: types[Math.floor(Math.random() * types.length)]
    }))
  }

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeys(prev => ({ ...prev, [e.key.toLowerCase()]: true }))
      
      if (e.key === 'e' || e.key === 'E') {
        // Enter/exit vehicle
        const nearbyVehicle = vehicles.find(v => 
          Math.abs(v.x - player.x) < VEHICLE_WIDTH && 
          Math.abs(v.y - player.y) < VEHICLE_HEIGHT
        )
        if (nearbyVehicle && !player.isInCar) {
          // Enter: snap the player onto the vehicle and remember which one it is,
          // so the game loop can move that vehicle with the player.
          setPlayer(prev => ({
            ...prev,
            isInCar: true,
            isDriving: true,
            currentVehicleId: nearbyVehicle.id,
            x: nearbyVehicle.x + (VEHICLE_WIDTH - PLAYER_SIZE) / 2,
            y: nearbyVehicle.y + (VEHICLE_HEIGHT - PLAYER_SIZE) / 2
          }))
        } else if (player.isInCar) {
          // Exit: step out beside the vehicle; the vehicle stays where it was driven.
          setPlayer(prev => ({
            ...prev,
            isInCar: false,
            isDriving: false,
            currentVehicleId: null,
            x: Math.max(0, Math.min(GAME_WIDTH - PLAYER_SIZE, prev.x - VEHICLE_WIDTH)),
            y: prev.y
          }))
        }
      }

      if (e.key === 'c' || e.key === 'C') {
        // Toggle smoking
        setPlayer(prev => ({ ...prev, isSmoking: !prev.isSmoking }))
      }

      if (e.key === 'f' || e.key === 'F') {
        // Melee attack
        const nearbyEnemy = enemies.find(en => 
          Math.abs(en.x - player.x) < 50 && 
          Math.abs(en.y - player.y) < 50
        )
        if (nearbyEnemy) {
          setEnemies(prev => prev.map(en => 
            en.id === nearbyEnemy.id 
              ? { ...en, health: en.health - 25 }
              : en
          ).filter(en => en.health > 0))
          setPlayer(prev => ({ ...prev, score: prev.score + 10 }))
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      setKeys(prev => ({ ...prev, [e.key.toLowerCase()]: false }))
    }

    if (gameStarted) {
      window.addEventListener("keydown", handleKeyDown)
      window.addEventListener("keyup", handleKeyUp)
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [gameStarted, vehicles, player, enemies])

  // Mouse controls
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (gameRef.current) {
        const rect = gameRef.current.getBoundingClientRect()
        setMousePos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        })
      }
    }

    const handleClick = () => {
      if (gameStarted && !gameOver && player.ammo > 0 && !player.isInCar) {
        // Shoot bullet
        const angle = Math.atan2(mousePos.y - player.y, mousePos.x - player.x)
        setBullets(prev => [...prev, {
          id: `bullet-${Date.now()}`,
          x: player.x,
          y: player.y,
          angle,
          speed: 10
        }])
        setPlayer(prev => ({ ...prev, ammo: prev.ammo - 1 }))
      }
    }

    if (gameStarted) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("click", handleClick)
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("click", handleClick)
    }
  }, [gameStarted, gameOver, player, mousePos])

  // Game loop
  useEffect(() => {
    if (!gameStarted || gameOver) return

    const gameLoop = () => {
      // Update player position
      setPlayer(prev => {
        let newX = prev.x
        let newY = prev.y
        const speed = prev.isDriving ? 5 : 3

        if (keys['w'] || keys['arrowup']) newY -= speed
        if (keys['s'] || keys['arrowdown']) newY += speed
        if (keys['a'] || keys['arrowleft']) newX -= speed
        if (keys['d'] || keys['arrowright']) newX += speed

        // Boundaries
        newX = Math.max(0, Math.min(GAME_WIDTH - PLAYER_SIZE, newX))
        newY = Math.max(0, Math.min(GAME_HEIGHT - PLAYER_SIZE, newY))

        // Calculate angle to mouse
        const angle = Math.atan2(mousePos.y - newY, mousePos.x - newX)

        // Smoking heals: +0.15 per frame (~9/sec at 60fps), capped at 100.
        // This is what the start screen ("Smoke (health regen)") and the
        // HEALING badge always promised — v1 never actually healed.
        const health = prev.isSmoking
          ? Math.min(100, prev.health + 0.15)
          : prev.health

        return { ...prev, x: newX, y: newY, angle, health }
      })

      // Move the vehicle the player is driving so it travels with them.
      // The vehicle is centred on the player; parked vehicles don't move.
      if (player.isDriving && player.currentVehicleId) {
        setVehicles(prev => prev.map(v =>
          v.id === player.currentVehicleId
            ? {
                ...v,
                x: Math.max(0, Math.min(GAME_WIDTH - VEHICLE_WIDTH, player.x - (VEHICLE_WIDTH - PLAYER_SIZE) / 2)),
                y: Math.max(0, Math.min(GAME_HEIGHT - VEHICLE_HEIGHT, player.y - (VEHICLE_HEIGHT - PLAYER_SIZE) / 2))
              }
            : v
        ))
      }

      // Update bullets
      setBullets(prev => prev
        .map(bullet => ({
          ...bullet,
          x: bullet.x + Math.cos(bullet.angle) * bullet.speed,
          y: bullet.y + Math.sin(bullet.angle) * bullet.speed
        }))
        .filter(bullet => 
          bullet.x >= 0 && bullet.x <= GAME_WIDTH &&
          bullet.y >= 0 && bullet.y <= GAME_HEIGHT
        )
      )

      // Bullet collision with enemies
      setBullets(prevBullets => {
        const remainingBullets = [...prevBullets]
        setEnemies(prevEnemies => {
          const updatedEnemies = prevEnemies.map(enemy => {
            const hitBullet = remainingBullets.find(bullet =>
              Math.abs(bullet.x - enemy.x) < ENEMY_SIZE &&
              Math.abs(bullet.y - enemy.y) < ENEMY_SIZE
            )
            if (hitBullet) {
              const index = remainingBullets.indexOf(hitBullet)
              if (index > -1) remainingBullets.splice(index, 1)
              return { ...enemy, health: enemy.health - 25 }
            }
            return enemy
          }).filter(enemy => {
            if (enemy.health <= 0) {
              setPlayer(prev => ({ ...prev, score: prev.score + 50, money: prev.money + 100 }))
              return false
            }
            return true
          })
          return updatedEnemies
        })
        return remainingBullets
      })

      // Enemy AI - move toward player
      setEnemies(prev => prev.map(enemy => {
        const dx = player.x - enemy.x
        const dy = player.y - enemy.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance > 100) {
          const angle = Math.atan2(dy, dx)
          return {
            ...enemy,
            x: enemy.x + Math.cos(angle) * 1.5,
            y: enemy.y + Math.sin(angle) * 1.5,
            angle
          }
        }
        return enemy
      }))

      // Check enemy collision with player
      enemies.forEach(enemy => {
        if (Math.abs(enemy.x - player.x) < PLAYER_SIZE && 
            Math.abs(enemy.y - player.y) < PLAYER_SIZE) {
          setPlayer(prev => ({ ...prev, health: Math.max(0, prev.health - 0.5) }))
        }
      })

      // Check collectible pickup
      setCollectibles(prev => {
        const remaining = prev.filter(col => {
          if (Math.abs(col.x - player.x) < COLLECTIBLE_SIZE + PLAYER_SIZE &&
              Math.abs(col.y - player.y) < COLLECTIBLE_SIZE + PLAYER_SIZE) {
            setPlayer(prevPlayer => {
              if (col.type === 'health') {
                return { ...prevPlayer, health: Math.min(100, prevPlayer.health + 25) }
              } else if (col.type === 'ammo') {
                return { ...prevPlayer, ammo: prevPlayer.ammo + 20 }
              } else if (col.type === 'money') {
                return { ...prevPlayer, money: prevPlayer.money + 50, score: prevPlayer.score + 25 }
              }
              return prevPlayer
            })
            return false
          }
          return true
        })
        
        // Spawn new collectibles
        if (remaining.length < 5) {
          const newCollectibles = generateCollectibles(1)
          return [...remaining, ...newCollectibles]
        }
        return remaining
      })

      // Spawn new enemies
      if (enemies.length < 5 && Math.random() < 0.01) {
        setEnemies(prev => [...prev, ...generateEnemies(1)])
      }

      // Check game over
      if (player.health <= 0) {
        setGameOver(true)
      }

      animationFrameRef.current = requestAnimationFrame(gameLoop)
    }

    animationFrameRef.current = requestAnimationFrame(gameLoop)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [gameStarted, gameOver, keys, player, enemies, mousePos])

  if (!gameStarted) {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-8"
        >
          <div className="space-y-4">
            <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500">
              STREET LEGENDS
            </h1>
            <p className="text-xl text-gray-300">Open World Action Game</p>
          </div>

          <Card className="bg-black/50 border-red-500/30 max-w-md mx-auto">
            <CardContent className="p-6 space-y-4 text-left">
              <h2 className="text-2xl font-bold text-red-500">Controls</h2>
              <div className="space-y-2 text-gray-300">
                <p><strong>WASD / Arrows:</strong> Move</p>
                <p><strong>Mouse:</strong> Aim & Click to Shoot</p>
                <p><strong>E:</strong> Enter/Exit Vehicle</p>
                <p><strong>F:</strong> Melee Attack</p>
                <p><strong>C:</strong> Smoke (health regen)</p>
              </div>
              <div className="pt-4 space-y-2">
                <p className="text-sm text-yellow-400">🎯 Defeat enemies for cash & points</p>
                <p className="text-sm text-green-400">💊 Collect items to survive</p>
                <p className="text-sm text-blue-400">🚗 Drive vehicles for speed</p>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={initGame}
            size="lg"
            className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white px-12 py-6 text-2xl"
          >
            START GAME
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-gray-900 via-gray-800 to-black flex flex-col items-center justify-center p-4">
      {/* HUD */}
      <div className="w-full max-w-4xl mb-4 flex justify-between items-start">
        <div className="space-y-2">
          <Card className="bg-black/70 border-red-500/30 inline-block">
            <CardContent className="p-3 flex items-center gap-2">
              <Heart className="text-red-500" />
              <div className="w-32 h-4 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-red-500 to-pink-500 transition-all"
                  style={{ width: `${player.health}%` }}
                />
              </div>
              <span className="text-white font-bold">{Math.round(player.health)}</span>
            </CardContent>
          </Card>

          <Card className="bg-black/70 border-yellow-500/30 inline-block">
            <CardContent className="p-3 flex items-center gap-2">
              <Crosshair className="text-yellow-500" />
              <span className="text-white font-bold">Ammo: {player.ammo}</span>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-2 text-right">
          <Card className="bg-black/70 border-green-500/30 inline-block">
            <CardContent className="p-3 flex items-center gap-2">
              <DollarSign className="text-green-500" />
              <span className="text-white font-bold">${player.money}</span>
            </CardContent>
          </Card>

          <Card className="bg-black/70 border-purple-500/30 inline-block">
            <CardContent className="p-3 flex items-center gap-2">
              <Trophy className="text-purple-500" />
              <span className="text-white font-bold">Score: {player.score}</span>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Game Canvas */}
      <div 
        ref={gameRef}
        className="relative bg-gradient-to-br from-gray-700 via-gray-600 to-gray-700 rounded-lg shadow-2xl overflow-hidden border-4 border-gray-800"
        style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
      >
        {/* Grid pattern */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />

        {/* Vehicles */}
        {vehicles.map(vehicle => (
          <motion.div
            key={vehicle.id}
            className="absolute rounded"
            style={{
              left: vehicle.x,
              top: vehicle.y,
              width: VEHICLE_WIDTH,
              height: VEHICLE_HEIGHT,
              backgroundColor: vehicle.color,
              border: '2px solid rgba(0,0,0,0.5)',
              boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
            }}
            animate={{ opacity: vehicle.health > 0 ? 1 : 0.3 }}
          >
            <Car className="w-full h-full p-1 text-white/50" />
          </motion.div>
        ))}

        {/* Collectibles */}
        {collectibles.map(col => (
          <motion.div
            key={col.id}
            className="absolute rounded-full flex items-center justify-center"
            style={{
              left: col.x,
              top: col.y,
              width: COLLECTIBLE_SIZE,
              height: COLLECTIBLE_SIZE,
              backgroundColor: col.type === 'health' ? '#ef4444' : col.type === 'ammo' ? '#eab308' : '#22c55e',
              border: '2px solid white',
              boxShadow: '0 0 10px rgba(255,255,255,0.5)'
            }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            {col.type === 'health' && <Heart className="w-3 h-3 text-white" />}
            {col.type === 'ammo' && <Zap className="w-3 h-3 text-white" />}
            {col.type === 'money' && <DollarSign className="w-3 h-3 text-white" />}
          </motion.div>
        ))}

        {/* Enemies */}
        {enemies.map(enemy => (
          <motion.div
            key={enemy.id}
            className="absolute bg-red-600 rounded flex items-center justify-center border-2 border-red-800"
            style={{
              left: enemy.x,
              top: enemy.y,
              width: ENEMY_SIZE,
              height: ENEMY_SIZE,
              transform: `rotate(${enemy.angle}rad)`
            }}
          >
            <Skull className="w-4 h-4 text-white" />
          </motion.div>
        ))}

        {/* Bullets */}
        {bullets.map(bullet => (
          <div
            key={bullet.id}
            className="absolute bg-yellow-400 rounded-full shadow-lg"
            style={{
              left: bullet.x,
              top: bullet.y,
              width: BULLET_SIZE,
              height: BULLET_SIZE,
              boxShadow: '0 0 10px rgba(234, 179, 8, 0.8)'
            }}
          />
        ))}

        {/* Player */}
        <motion.div
          className="absolute"
          style={{
            left: player.x,
            top: player.y,
            width: PLAYER_SIZE,
            height: PLAYER_SIZE,
            transform: `rotate(${player.angle}rad)`
          }}
        >
          {player.isDriving ? (
            <div className="w-full h-full bg-blue-600 rounded border-2 border-blue-800 flex items-center justify-center">
              <Car className="w-5 h-5 text-white" />
            </div>
          ) : (
            <div className="w-full h-full bg-green-600 rounded-full border-2 border-green-800 flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full" />
            </div>
          )}
          {player.isSmoking && (
            <motion.div
              className="absolute -top-2 left-1/2 -translate-x-1/2"
              animate={{ y: [-5, -15], opacity: [1, 0] }}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              <Cigarette className="w-3 h-3 text-gray-400" />
            </motion.div>
          )}
        </motion.div>

        {/* Crosshair */}
        {!player.isInCar && (
          <div
            className="absolute pointer-events-none"
            style={{
              left: mousePos.x - 10,
              top: mousePos.y - 10,
              width: 20,
              height: 20
            }}
          >
            <Crosshair className="w-full h-full text-red-500" strokeWidth={3} />
          </div>
        )}

        {/* Game Over Overlay */}
        <AnimatePresence>
          {gameOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-black/80 flex items-center justify-center"
            >
              <div className="text-center space-y-6">
                <h2 className="text-6xl font-bold text-red-500">WASTED</h2>
                <div className="space-y-2 text-white">
                  <p className="text-2xl">Final Score: {player.score}</p>
                  <p className="text-xl">Money Earned: ${player.money}</p>
                </div>
                <Button
                  onClick={initGame}
                  size="lg"
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  RESTART
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Status indicators */}
      <div className="mt-4 flex gap-4">
        {player.isDriving && (
          <Card className="bg-black/70 border-blue-500/30">
            <CardContent className="p-2 flex items-center gap-2">
              <Car className="text-blue-500 w-5 h-5" />
              <span className="text-white text-sm font-bold">DRIVING</span>
            </CardContent>
          </Card>
        )}
        {player.isSmoking && (
          <Card className="bg-black/70 border-gray-500/30">
            <CardContent className="p-2 flex items-center gap-2">
              <Cigarette className="text-gray-400 w-5 h-5" />
              <span className="text-white text-sm font-bold">HEALING</span>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
