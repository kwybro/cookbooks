#if os(iOS)
import SwiftUI
import UIKit

/// Wraps UIImagePickerController to provide camera capture in SwiftUI.
struct CameraView: UIViewControllerRepresentable {
    @Binding var images: [UIImage]
    var onDismiss: () -> Void

    func makeCoordinator() -> Coordinator {
        Coordinator(images: $images, onDismiss: onDismiss)
    }

    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.sourceType = UIImagePickerController.isSourceTypeAvailable(.camera) ? .camera : .photoLibrary
        picker.delegate = context.coordinator
        return picker
    }

    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}

    class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        @Binding var images: [UIImage]
        var onDismiss: () -> Void

        init(images: Binding<[UIImage]>, onDismiss: @escaping () -> Void) {
            _images = images
            self.onDismiss = onDismiss
        }

        func imagePickerController(
            _ picker: UIImagePickerController,
            didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]
        ) {
            if let image = info[.originalImage] as? UIImage {
                images.append(image)
            }
            onDismiss()
        }

        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            onDismiss()
        }
    }
}
#endif
