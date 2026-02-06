import { Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { ImageUploader } from '../components/ImageUploader';
import { IndexImageCard } from '../components/IndexImageCard';
import { RecipeList } from '../components/RecipeList';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { useBook } from '../hooks/useBooks';
import { useIndexImages, useProcessIndexImage, useUploadIndexImage } from '../hooks/useIndexImages';

interface BookPageProps {
  bookId: string;
}

export function BookPage({ bookId }: BookPageProps) {
  const { data: book, isLoading: isLoadingBook, error: bookError } = useBook(bookId);
  const { data: indexImages, isLoading: isLoadingImages } = useIndexImages(bookId);
  const uploadImage = useUploadIndexImage();
  const processImage = useProcessIndexImage();

  const handleUpload = async (file: {
    filename: string;
    contentType: string;
    imageData: string;
  }) => {
    await uploadImage.mutateAsync({
      bookId,
      ...file,
    });
  };

  const handleProcess = (indexImageId: string) => {
    processImage.mutate({ indexImageId });
  };

  if (bookError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-destructive">
          <p>Failed to load book. Please try again.</p>
          <Link to="/">
            <Button variant="link" className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Books
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Books
        </Button>
      </Link>

      {isLoadingBook ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-6 w-48" />
        </div>
      ) : book ? (
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold">{book.title}</h1>
            {book.author && <p className="text-lg text-muted-foreground mt-1">by {book.author}</p>}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Upload Index Image</h2>
                <ImageUploader onUpload={handleUpload} isUploading={uploadImage.isPending} />
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">Index Images</h2>
                {isLoadingImages ? (
                  <div className="space-y-2">
                    {[1, 2].map((i) => (
                      <Skeleton key={i} className="h-16" />
                    ))}
                  </div>
                ) : indexImages && indexImages.length > 0 ? (
                  <div className="space-y-2">
                    {indexImages.map((image) => (
                      <IndexImageCard
                        key={image.id}
                        id={image.id}
                        r2Key={image.r2Key}
                        status={image.status as 'pending' | 'processing' | 'completed' | 'failed'}
                        createdAt={image.createdAt}
                        onProcess={handleProcess}
                        isProcessing={processImage.isPending}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No index images uploaded yet.
                  </p>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Extracted Recipes</h2>
              <RecipeList recipes={book.recipes} isLoading={isLoadingBook} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
