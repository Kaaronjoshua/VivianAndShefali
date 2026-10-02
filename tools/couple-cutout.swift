// Cuts the couple out of one photo (real faces, nothing redrawn) and places them on white, 1920x1080.
// Usage: swift tools/couple-cutout.swift photo.png out.png [keep=0.62] [mirror]
//   keep   = how much to show from the top of the heads down (0.62 ≈ waist up)
//   mirror = flip left/right (swaps which side each person stands on)
import Foundation
import Vision
import CoreImage
import ImageIO
import UniformTypeIdentifiers

let a = CommandLine.arguments
guard a.count >= 3 else { print("Usage: swift tools/couple-cutout.swift photo.png out.png [keep=0.62] [mirror]"); exit(1) }
let keep = a.count > 3 ? Double(a[3]) ?? 0.62 : 0.62
let mirror = a.contains("mirror")
let ci = CIContext()

guard let src = CGImageSourceCreateWithURL(URL(fileURLWithPath: a[1]) as CFURL, nil),
      let img = CGImageSourceCreateImageAtIndex(src, 0, nil) else { print("Cannot read \(a[1])"); exit(1) }
let handler = VNImageRequestHandler(cgImage: img)
let req = VNGenerateForegroundInstanceMaskRequest()
try handler.perform([req])
guard let r = req.results?.first,
      let buf = try? r.generateMaskedImage(ofInstances: r.allInstances, from: handler, croppedToInstancesExtent: true)
else { print("No people found"); exit(1) }
print("People/objects found: \(r.allInstances.count)")
var cut = CIImage(cvPixelBuffer: buf)
if mirror { cut = cut.transformed(by: CGAffineTransform(scaleX: -1, y: 1).translatedBy(x: -cut.extent.width, y: 0)) }
guard let person = ci.createCGImage(cut, from: cut.extent) else { exit(1) }

let W = 1920, H = 1080
let ctx = CGContext(data: nil, width: W, height: H, bitsPerComponent: 8, bytesPerRow: 0,
                    space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
ctx.setFillColor(CGColor(red: 1, green: 1, blue: 1, alpha: 1))
ctx.fill(CGRect(x: 0, y: 0, width: W, height: H))
ctx.interpolationQuality = .high
let cropH = Int(Double(person.height) * keep)
let top = person.cropping(to: CGRect(x: 0, y: 0, width: person.width, height: cropH))!
var th = Double(H) * 0.94
var tw = Double(top.width) * th / Double(cropH)
if tw > Double(W) * 0.9 { tw = Double(W) * 0.9; th = Double(cropH) * tw / Double(top.width) }
ctx.draw(top, in: CGRect(x: (Double(W) - tw) / 2, y: 0, width: tw, height: th))

let dest = CGImageDestinationCreateWithURL(URL(fileURLWithPath: a[2]) as CFURL, UTType.png.identifier as CFString, 1, nil)!
CGImageDestinationAddImage(dest, ctx.makeImage()!, nil)
CGImageDestinationFinalize(dest)
print("Saved \(a[2])")
