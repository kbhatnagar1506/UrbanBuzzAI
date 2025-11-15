"use client"

import { useState, useRef, useMemo, useEffect } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Text } from "@react-three/drei"
import { Button } from "@/components/ui/button"
import { Loader2, Sparkles, Network } from "lucide-react"
import * as THREE from "three"
import { motion, AnimatePresence } from "framer-motion"

interface ImageNode {
  id: string
  imageUrl: string
  label: string
  description: string
  features: string[]
  position: [number, number, number]
  connections: string[]
}

interface KnowledgeGraphProps {
  images: Array<{ url: string; label: string; heading: number }>
  geminiKey: string
}

// 3D Node Component
function GraphNode({ node, onClick }: { node: ImageNode; onClick: () => void }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [texture, setTexture] = useState<THREE.Texture | null>(null)

  useEffect(() => {
    const loader = new THREE.TextureLoader()
    loader.load(
      node.imageUrl,
      (loadedTexture) => {
        loadedTexture.minFilter = THREE.LinearFilter
        setTexture(loadedTexture)
      },
      undefined,
      (error) => {
        console.error('Error loading texture:', error)
      }
    )
  }, [node.imageUrl])

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005
      meshRef.current.position.y = node.position[1] + Math.sin(state.clock.elapsedTime + node.id.charCodeAt(0)) * 0.1
    }
  })

  return (
    <group position={node.position}>
      <mesh 
        ref={meshRef} 
        onClick={onClick} 
        onPointerOver={(e) => {
          e.stopPropagation()
          document.body.style.cursor = 'pointer'
          if (meshRef.current) {
            meshRef.current.scale.set(1.2, 1.2, 1.2)
          }
        }} 
        onPointerOut={() => {
          document.body.style.cursor = 'auto'
          if (meshRef.current) {
            meshRef.current.scale.set(1, 1, 1)
          }
        }}
      >
        <boxGeometry args={[2, 2, 0.3]} />
        {texture ? (
          <meshStandardMaterial map={texture} />
        ) : (
          <meshStandardMaterial color="#3b82f6" />
        )}
      </mesh>
      <Text
        position={[0, -1, 0]}
        fontSize={0.2}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {node.label}
      </Text>
    </group>
  )
}

// Connection Line Component
function ConnectionLine({ from, to }: { from: ImageNode; to: ImageNode }) {
  const points = useMemo(() => {
    return [
      new THREE.Vector3(...from.position),
      new THREE.Vector3(...to.position)
    ]
  }, [from.position, to.position])

  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry().setFromPoints(points)
    return geom
  }, [points])

  return (
    <line geometry={geometry}>
      <lineBasicMaterial color="#3b82f6" opacity={0.5} transparent />
    </line>
  )
}

// Main 3D Scene
function GraphScene({ nodes, onNodeClick }: { nodes: ImageNode[]; onNodeClick: (node: ImageNode) => void }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <pointLight position={[-10, -10, -10]} intensity={0.3} />
      
      {nodes.map((node) => (
        <GraphNode key={node.id} node={node} onClick={() => onNodeClick(node)} />
      ))}
      
      {nodes.map((node) =>
        node.connections.map((connectionId) => {
          const connectedNode = nodes.find(n => n.id === connectionId)
          if (!connectedNode) return null
          return <ConnectionLine key={`${node.id}-${connectionId}`} from={node} to={connectedNode} />
        })
      )}
      
      <OrbitControls enableDamping dampingFactor={0.05} />
    </>
  )
}

export function KnowledgeGraph3D({ images, geminiKey }: KnowledgeGraphProps) {
  const [nodes, setNodes] = useState<ImageNode[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<ImageNode | null>(null)
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || geminiKey || ""

  // Analyze images with Google Gemini 1.5 Flash API
  const analyzeImages = async () => {
    if (!apiKey) {
      setError("Please provide a Gemini API key")
      return
    }

    if (images.length === 0) {
      setError("Please load Street View images first")
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Analyze each image and extract features
      const analysisPromises = images.map(async (image, index) => {
        try {
          // Convert image URL to base64 (for OpenAI Vision API)
          const imageResponse = await fetch(image.url)
          const blob = await imageResponse.blob()
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => {
              const base64String = (reader.result as string).split(',')[1]
              resolve(base64String)
            }
            reader.readAsDataURL(blob)
          })

          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [
                  {
                    text: `Analyze this Street View image from ${image.label} direction. Extract:
1. Key visual features (buildings, landmarks, signs, vehicles, people, etc.)
2. Environmental characteristics (urban/rural, time of day, weather, etc.)
3. Notable elements that could connect this location to other nearby views
4. A brief description (2-3 sentences)

Return as JSON: { "description": "...", "features": ["feature1", "feature2"], "connections": ["what connects to other views"] }`
                  },
                  {
                    inline_data: {
                      mime_type: "image/jpeg",
                      data: base64
                    }
                  }
                ]
              }],
              generationConfig: {
                temperature: 0.4,
                maxOutputTokens: 500,
              }
            }),
          })

          if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Gemini API error: ${response.status} ${errorText}`)
          }

          const data = await response.json()
          const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
          
          // Parse JSON from response
          let parsed
          try {
            // Extract JSON from markdown code blocks if present
            const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/)
            parsed = JSON.parse(jsonMatch ? jsonMatch[1] : content)
          } catch {
            // Fallback: try to extract JSON-like structure
            parsed = {
              description: content.substring(0, 200),
              features: content.match(/features?[:\s]+\[(.*?)\]/i)?.[1]?.split(',').map((f: string) => f.trim()) || [],
              connections: []
            }
          }

          return {
            id: `node-${index}`,
            imageUrl: image.url,
            label: image.label,
            description: parsed.description || `Street view from ${image.label}`,
            features: parsed.features || [],
            position: [
              Math.cos((index * Math.PI * 2) / images.length) * 4,
              Math.sin((index * Math.PI * 2) / images.length) * 2.5,
              Math.sin((index * Math.PI * 2) / images.length) * 4,
            ] as [number, number, number],
            connections: []
          }
        } catch (err) {
          console.error(`Error analyzing image ${index}:`, err)
          // Return a default node if analysis fails
          return {
            id: `node-${index}`,
            imageUrl: image.url,
            label: image.label,
            description: `Street view from ${image.label} direction`,
            features: [],
            position: [
              Math.cos((index * Math.PI * 2) / images.length) * 4,
              Math.sin((index * Math.PI * 2) / images.length) * 2.5,
              Math.sin((index * Math.PI * 2) / images.length) * 4,
            ] as [number, number, number],
            connections: []
          }
        }
      })

      const analyzedNodes = await Promise.all(analysisPromises)

      // Create connections based on shared features and proximity
      const nodesWithConnections = analyzedNodes.map((node, index) => {
        const connections: string[] = []
        
        // Connect to adjacent nodes (neighboring views)
        const prevIndex = (index - 1 + analyzedNodes.length) % analyzedNodes.length
        const nextIndex = (index + 1) % analyzedNodes.length
        connections.push(analyzedNodes[prevIndex].id, analyzedNodes[nextIndex].id)

        // Connect nodes with similar features
        analyzedNodes.forEach((otherNode, otherIndex) => {
          if (otherIndex !== index) {
            const sharedFeatures = node.features.filter(f => 
              otherNode.features.some(of => 
                of.toLowerCase().includes(f.toLowerCase()) || 
                f.toLowerCase().includes(of.toLowerCase())
              )
            )
            if (sharedFeatures.length > 0 && !connections.includes(otherNode.id)) {
              connections.push(otherNode.id)
            }
          }
        })

        return { ...node, connections }
      })

      setNodes(nodesWithConnections)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze images")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* Controls */}
      <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl shadow-xl p-6">
        <div className="space-y-4">
          <Button
            onClick={analyzeImages}
            disabled={loading || images.length === 0 || !apiKey}
            className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing Images with AI...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Knowledge Graph
              </>
            )}
          </Button>

          {!apiKey && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm"
            >
              Gemini API key not found. Please set NEXT_PUBLIC_GEMINI_API_KEY in your .env file.
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm"
            >
              {error}
            </motion.div>
          )}
        </div>
      </div>

      {/* 3D Graph Visualization */}
      {nodes.length > 0 && (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="h-[600px] relative">
              <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
                <GraphScene 
                  nodes={nodes} 
                  onNodeClick={(node) => setSelectedNode(node)}
                />
              </Canvas>
              
              {/* Info Overlay */}
              <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg p-4 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <Network className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">Knowledge Graph</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {nodes.length} nodes • {nodes.reduce((sum, n) => sum + n.connections.length, 0) / 2} connections
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Click nodes to view details • Drag to rotate
                </p>
              </div>
            </div>
          </motion.div>

          {/* Image Gallery - Show All Images */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl shadow-xl p-6"
          >
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-foreground mb-2">
                All Images in Knowledge Graph
              </h3>
              <p className="text-muted-foreground">
                Click any image to view details and AI analysis
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {nodes.map((node, index) => (
                <motion.div
                  key={node.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative bg-background border border-border/50 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all cursor-pointer"
                  onClick={() => setSelectedNode(node)}
                >
                  <div className="aspect-square relative overflow-hidden">
                    <img
                      src={node.imageUrl}
                      alt={node.label}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-full group-hover:translate-y-0 transition-transform">
                      <span className="text-white font-semibold text-sm block">
                        {node.label}
                      </span>
                      {node.features.length > 0 && (
                        <span className="text-white/80 text-xs block mt-1">
                          {node.features.slice(0, 2).join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm px-2 py-1 rounded-md">
                    <span className="text-xs font-medium text-foreground">
                      {node.label}
                    </span>
                  </div>
                  {node.features.length > 0 && (
                    <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                      {node.features.slice(0, 2).map((feature, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-primary/90 text-primary-foreground text-xs rounded-full font-medium"
                        >
                          {feature.length > 10 ? feature.substring(0, 10) + '...' : feature}
                        </span>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </>
      )}

      {/* Node Details Modal */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedNode(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-card border border-border rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-2xl font-bold text-foreground">{selectedNode.label}</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedNode(null)}
                >
                  ×
                </Button>
              </div>
              
              <img
                src={selectedNode.imageUrl}
                alt={selectedNode.label}
                className="w-full h-64 object-cover rounded-lg mb-4"
              />
              
              <p className="text-muted-foreground mb-4">{selectedNode.description}</p>
              
              {selectedNode.features.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-foreground mb-2">Features:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedNode.features.map((feature, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <h4 className="font-semibold text-foreground mb-2">Connections:</h4>
                <p className="text-sm text-muted-foreground">
                  Connected to {selectedNode.connections.length} other views
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

