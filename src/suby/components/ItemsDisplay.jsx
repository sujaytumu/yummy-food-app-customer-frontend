import React, {useState} from 'react'
import { itemData } from '../data'

const ItemsDisplay = () => {
    const [displayItem, setDisplayItem] = useState(itemData)


  return (
        <div className="itemSection">
            {displayItem.map((item)=>{
                return(
                    <div className="gallery" key={item.id || item.item_img}>
                        <img src={item.item_img} alt={item.item_img} />
                    </div>
                )
            })}
        </div>
  )
}

export default ItemsDisplay