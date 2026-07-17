import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

// Ce decorator n'exécute AUCUNE logique lui-même : il attache juste une métadonnée
// invisible ("isPublic: true") sur la route. C'est le JwtAuthGuard, via Reflector,
// qui ira relire cette métadonnée pour décider de sauter la vérification du token.
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
