import { View, Text , StyleSheet } from 'react-native'
import React , {Children, FC} from 'react'

import { RFValue } from 'react-native-responsive-fontsize'

const fontSizes = {
    h1: 24,
    h2: 22,
    h3: 20,
    h4: 18,
    h5: 16,
    h6: 14,
    h7: 10,
    h8: 9,
}

const CustomText:FC<CustomTextProps> = ({
    variant='h6',
    style,
    fontFamily = 'Regular',
    fontSize,
    numberOfLines,
    children
}) => {
  return (
    <Text
        style={[styles.text, {fontSize: RFValue(fontSize ? fontSize : fontSizes[variant]) , fontFamily: `Rubik-${fontFamily}`}, style]}
        numberOfLines={numberOfLines ? numberOfLines : undefined}
    >
        {children}
    </Text>
  )
}

const styles = StyleSheet.create({
    text: {
        color: '#000000',
        textAlign: 'left'
    }
})

export default CustomText