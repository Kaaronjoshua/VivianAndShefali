// Builds the video start frame from the REAL photos, so faces never change.
// Cuts each person out with macOS subject lifting and places them on white, 1920x1080.
// Usage: swift tools/couple-frame.swift bride.png groom.png out.png [keep=0.6]
//   keep = how much of each person to show, from the top of the head down (0.6 ≈ waist up)
import Foundation
import Vision
import CoreImage
import ImageIO
import UniformTypeIdentifiers

let args = CommandLine.arguments
guard args.count >= 4 else {
  print("Usage: swift tools/couple-frame.swift bride.png groom.png out.png [keep=0.6]"); exit(1)
}
let keep = args.count > 4 ? Double(args[4]) ?? 0.6 : 0.6
let ci = CIContext()

func load(_ path: String) -> CGImage {
  guard let src = CGImageSourceCreateWithURL(URL(fileURLWithPath: path) as CFURL, nil),
        let img = CGImageSourceCreateImageAtIndex(src, 0, nil) else { print("Cannot read \(path)"); exit(1) }
  return img
}

func cutout(_ img: CGImage, _ name: String) -> CGImage {
  let handler = VNImageRequestHandler(cgImage: img)
  let req = VNGenerateForegroundInstanceMaskRequest()
  do { try handler.perform([req]) } catch { print("Subject detection failed for \(name): \(error)"); exit(1) }
  guard let result = req.results?.first,
        let buf = try? result.generateMaskedImage(ofInstances: result.allInstances, from: handler, croppedToInstancesExtent: true),
        let out = ci.createCGImage(CIImage(cvPixelBuffer: buf), from: CIImage(cvPixelBuffer: buf).extent)
  else { print("No person found in \(name)"); exit(1) }
  return out
}

let W = 1920, H = 1080
guard let ctx = CGContext(data: nil, width: W, height: H, bitsPerComponent: 8, bytesPerRow: 0,
                          space: CGColorSpace(name: CGColorSpace.sRGB)!,
                          bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { exit(1) }
ctx.setFillColor(CGColor(red: 1, green: 1, blue: 1, alpha: 1))
ctx.fill(CGRect(x: 0, y: 0, width: W, height: H))
ctx.interpolationQuality = .high

for (path, centerX) in [(args[1], 0.31), (args[2], 0.69)] {
  let person = cutout(load(path), path)
  let cropH = Int(Double(person.height) * keep)
  guard let top = person.cropping(to: CGRect(x: 0, y: 0, width: person.width, height: cropH)) else { continue }
  let targetH = Double(H) * 0.93                       // small white margin above the heads
  let scale = targetH / Double(cropH)
  let targetW = Double(top.width) * scale
  ctx.draw(top, in: CGRect(x: Double(W) * centerX - targetW / 2, y: 0, width: targetW, height: targetH))
}

guard let final = ctx.makeImage(),
      let dest = CGImageDestinationCreateWithURL(URL(fileURLWithPath: args[3]) as CFURL, UTType.png.identifier as CFString, 1, nil)
else { exit(1) }
CGImageDestinationAddImage(dest, final, nil)
CGImageDestinationFinalize(dest)
print("Saved \(args[3])")
