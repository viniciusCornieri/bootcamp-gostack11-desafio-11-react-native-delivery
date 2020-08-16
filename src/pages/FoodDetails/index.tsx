import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { Image } from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import formatValue from '../../utils/formatValue';

import api from '../../services/api';

import {
  Container,
  Header,
  ScrollContainer,
  FoodsContainer,
  Food,
  FoodImageContainer,
  FoodContent,
  FoodTitle,
  FoodDescription,
  FoodPricing,
  AdditionalsContainer,
  Title,
  TotalContainer,
  AdittionalItem,
  AdittionalItemText,
  AdittionalQuantity,
  PriceButtonContainer,
  TotalPrice,
  QuantityContainer,
  FinishOrderButton,
  ButtonText,
  IconContainer,
} from './styles';

interface Params {
  id: number;
}

interface Extra {
  id: number;
  name: string;
  value: number;
  quantity: number;
}

interface Food {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  formattedPrice: string;
  extras: Extra[];
}

const FoodDetails: React.FC = () => {
  const [food, setFood] = useState({} as Food);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [foodQuantity, setFoodQuantity] = useState(1);

  const navigation = useNavigation();
  const route = useRoute();

  const routeParams = route.params as Params;

  useEffect(() => {
    async function loadFood(): Promise<void> {
      try {
        const response = await api.get(`/foods/${routeParams.id}`);
        const foodWithExtras = response.data;
        const initialExtras = foodWithExtras.extras.map((e: Extra) => ({
          ...e,
          quantity: 0,
        }));

        setFood(foodWithExtras);
        setExtras(initialExtras);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(
          `Problem when trying to get food with id ${routeParams.id}`,
          err,
        );
      }
    }

    loadFood();
  }, [routeParams.id, setFood, setExtras]);

  useEffect(() => {
    async function loadFavorite(): Promise<void> {
      try {
        await api.get(`/favorites/${routeParams.id}`);
        setIsFavorite(true);
      } catch (err) {
        setIsFavorite(false);
      }
    }

    loadFavorite();
  }, [routeParams.id, setIsFavorite]);

  const handleIncrementExtra = useCallback(
    (id: number) => {
      setExtras(oldExtras =>
        oldExtras.map(e =>
          e.id === id ? { ...e, quantity: e.quantity + 1 } : e,
        ),
      );
    },
    [setExtras],
  );

  const handleDecrementExtra = useCallback(
    (id: number) => {
      setExtras(oldExtras =>
        oldExtras.map(e =>
          e.id === id && e.quantity > 0
            ? { ...e, quantity: e.quantity - 1 }
            : e,
        ),
      );
    },
    [setExtras],
  );

  const handleIncrementFood = useCallback(() => {
    setFoodQuantity(old => old + 1);
  }, [setFoodQuantity]);

  const handleDecrementFood = useCallback(() => {
    setFoodQuantity(old => (old > 1 ? old - 1 : 1));
  }, [setFoodQuantity]);

  const toggleFavorite = useCallback(() => {
    setIsFavorite(oldFav => !oldFav);
  }, [setIsFavorite]);

  const saveFavorite = useCallback(() => {
    if (food) {
      api.post(`/favorites`, food).catch(err => console.log(err));
    }
  }, [food]);

  const deleteFavorite = useCallback(() => {
    if (food && food.id) {
      api
        .delete(`/favorites/${food.id}`)
        .catch(() => console.log(`could not delete favorite ${food.id}`));
    }
  }, [food]);

  useEffect(() => {
    if (isFavorite) {
      saveFavorite();
    } else {
      deleteFavorite();
    }
  }, [isFavorite]);

  const cartTotal = useMemo(() => {
    const extrasTotal = extras.reduce(
      (sum, current) => sum + current.quantity * current.value,
      0,
    );
    const total = extrasTotal + food.price * foodQuantity;
    return formatValue(total);
  }, [extras, food, foodQuantity]);

  async function handleFinishOrder(): Promise<void> {
    api.post('/orders', {
      ...food,
      id: undefined,
      product_id: food.id,
      extras,
      foodQuantity,
    });
    navigation.goBack();
  }

  // Calculate the correct icon name
  const favoriteIconName = useMemo(
    () => (isFavorite ? 'favorite' : 'favorite-border'),
    [isFavorite],
  );

  useLayoutEffect(() => {
    // Add the favorite icon on the right of the header bar
    navigation.setOptions({
      headerRight: () => (
        <MaterialIcon
          name={favoriteIconName}
          size={24}
          color="#FFB84D"
          onPress={() => toggleFavorite()}
        />
      ),
    });
  }, [navigation, favoriteIconName, toggleFavorite]);

  return (
    <Container>
      <Header />

      <ScrollContainer>
        <FoodsContainer>
          <Food>
            <FoodImageContainer>
              <Image
                style={{ width: 327, height: 183 }}
                source={{
                  uri: food.image_url,
                }}
              />
            </FoodImageContainer>
            <FoodContent>
              <FoodTitle>{food.name}</FoodTitle>
              <FoodDescription>{food.description}</FoodDescription>
              <FoodPricing>{food.formattedPrice}</FoodPricing>
            </FoodContent>
          </Food>
        </FoodsContainer>
        <AdditionalsContainer>
          <Title>Adicionais</Title>
          {extras.map(extra => (
            <AdittionalItem key={extra.id}>
              <AdittionalItemText>{extra.name}</AdittionalItemText>
              <AdittionalQuantity>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="minus"
                  onPress={() => handleDecrementExtra(extra.id)}
                  testID={`decrement-extra-${extra.id}`}
                />
                <AdittionalItemText testID={`extra-quantity-${extra.id}`}>
                  {extra.quantity}
                </AdittionalItemText>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="plus"
                  onPress={() => handleIncrementExtra(extra.id)}
                  testID={`increment-extra-${extra.id}`}
                />
              </AdittionalQuantity>
            </AdittionalItem>
          ))}
        </AdditionalsContainer>
        <TotalContainer>
          <Title>Total do pedido</Title>
          <PriceButtonContainer>
            <TotalPrice testID="cart-total">{cartTotal}</TotalPrice>
            <QuantityContainer>
              <Icon
                size={15}
                color="#6C6C80"
                name="minus"
                onPress={handleDecrementFood}
                testID="decrement-food"
              />
              <AdittionalItemText testID="food-quantity">
                {foodQuantity}
              </AdittionalItemText>
              <Icon
                size={15}
                color="#6C6C80"
                name="plus"
                onPress={handleIncrementFood}
                testID="increment-food"
              />
            </QuantityContainer>
          </PriceButtonContainer>

          <FinishOrderButton onPress={() => handleFinishOrder()}>
            <ButtonText>Confirmar pedido</ButtonText>
            <IconContainer>
              <Icon name="check-square" size={24} color="#fff" />
            </IconContainer>
          </FinishOrderButton>
        </TotalContainer>
      </ScrollContainer>
    </Container>
  );
};

export default FoodDetails;
