import { View, Text, TouchableOpacity , StyleSheet, ActivityIndicator } from 'react-native'
import React , {FC} from 'react'

import CustomText from './CustomText'
import { RFValue } from 'react-native-responsive-fontsize'

const CustomButton: FC<CustomButtonProps> = ({onPress , title , disabled , loading}) => {
  return (
    <View>
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.8}
            style={[
                styles.container , {
                    backgroundColor: '#000066'
                }
            ]}
        >
            {loading ?
                <ActivityIndicator color='#ffffff' size='small'/> : 
                <CustomText 
                    fontFamily='SemiBold' 
                    style={{
                        fontSize: RFValue(15),
                        color: '#fff'
                    }}  
                > 
                    {title} 
                </CustomText>
            }

        </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 20,
        margin: 10 , 
        padding: 10,
        height: 45,
        justifyContent: 'center',
        alignItems: 'center',
        width: '90%',
        marginTop: 40
    }
})

export default CustomButton